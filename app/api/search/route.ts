import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

interface SearchResult {
  title?: string;
  summary?: string;
  historicalContext?: string;
  anecdote?: string;
  exposition?: {
    introduction: string;
    paragraphs: string[];
    conclusion: string;
  };
  sources?: Array<{ url: string; title: string }>;
  images?: Array<{ url: string; description: string }>;
  keywords?: string[];
}

const prompts = (query: string) => ({
  title: `Donne-moi un titre accrocheur (5-10 mots max) pour : ${query}`,
  summary: `Fais un résumé en 3 lignes pour : ${query}`,
  historicalContext: `Donne-moi 3 repères historiques (dates ou périodes clés, 4 lignes max) pour : ${query}`,
  anecdote: `Donne-moi une anecdote historique (3 lignes max) sur : ${query}`,
  exposition: `Rédige un exposé structuré sur : ${query}
Introduction (3 lignes max)
Paragraphe 1 - Approche Philosophique (8-10 lignes)
Paragraphe 2 - Analyse Critique (8-10 lignes) 
Paragraphe 3 - Perspective Contemporaine (8-10 lignes)
Conclusion (3 lignes max)`,
  sources: `Donne-moi 3 sources fiables (format : url - titre court) pour : ${query}`,
  images: `Donne-moi 3 images libres de droits (format : url - description courte) pour : ${query}`,
  keywords: `Donne-moi 3 mots-clés pertinents (séparés par des virgules, 15 caractères max chacun) pour : ${query}`,
});

async function askMistral(prompt: string): Promise<string> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.9
    })
  });
  if (!response.ok) {
    throw new Error(`Erreur Mistral AI (${response.status})`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Utilitaire pour nettoyer le texte
function cleanText(text: string): string {
  return text.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

function parseExposition(content: string) {
  // Extraction de l'introduction
  const introRegex = /introduction\s*(?:\(.*?\))?\s*:?\s*([\s\S]*?)(?=paragraphe 1|$)/i;
  const introMatch = content.match(introRegex);
  const introduction = introMatch ? cleanText(introMatch[1]) : '';

  // Extraction des paragraphes
  const p1Regex = /paragraphe 1.*?:?\s*([\s\S]*?)(?=paragraphe 2|$)/i;
  const p1Match = content.match(p1Regex);
  const p1 = p1Match ? cleanText(p1Match[1]) : '';

  const p2Regex = /paragraphe 2.*?:?\s*([\s\S]*?)(?=paragraphe 3|$)/i;
  const p2Match = content.match(p2Regex);
  const p2 = p2Match ? cleanText(p2Match[1]) : '';

  const p3Regex = /paragraphe 3.*?:?\s*([\s\S]*?)(?=conclusion|$)/i;
  const p3Match = content.match(p3Regex);
  const p3 = p3Match ? cleanText(p3Match[1]) : '';

  // Extraction de la conclusion
  const concluRegex = /conclusion\s*(?:\(.*?\))?\s*:?\s*([\s\S]*?)$/i;
  const concluMatch = content.match(concluRegex);
  const conclusion = concluMatch ? cleanText(concluMatch[1]) : '';

  return {
    introduction,
    paragraphs: [p1, p2, p3].filter(p => p.length > 0),
    conclusion
  };
}

function parseSources(content: string) {
  return content.split('\n')
    .map(line => {
      const match = line.match(/(?:\d+\.\s*)?(https?:\/\/[^\s]+)\s*-\s*(.*)$/);
      return match ? { url: match[1].trim(), title: cleanText(match[2]) } : null;
    })
    .filter((s): s is { url: string; title: string } => !!s);
}

function parseImages(content: string) {
  return content.split('\n')
    .map(line => {
      const match = line.match(/(?:\d+\.\s*)?(https?:\/\/[^\s]+)\s*-\s*(.*)$/);
      return match ? { url: match[1].trim(), description: cleanText(match[2]) } : null;
    })
    .filter((img): img is { url: string; description: string } => !!img);
}

function parseKeywords(content: string) {
  return content.split(',').map(k => cleanText(k)).filter(Boolean);
}

// Fonction utilitaire pour exécuter les tâches séquentiellement
async function executeTasksSequentially<T>(
  tasks: (() => Promise<T>)[],
  controller: ReadableStreamDefaultController
): Promise<T[]> {
  const results: T[] = [];
  let controllerClosed = false;
  
  // Fonction pour vérifier si le controller est toujours utilisable
  const canSendData = () => !controllerClosed;
  
  // Fonction pour fermer le controller en toute sécurité
  const safeCloseController = () => {
    if (!controllerClosed) {
      try {
        controllerClosed = true;
        console.log('Fermeture du stream');
        controller.close();
      } catch (e) {
        console.error("Erreur lors de la fermeture du controller:", e);
      }
    }
  };
  
  // Fonction pour envoyer des données en toute sécurité
  const safeSendData = (data: string) => {
    if (canSendData()) {
      try {
        controller.enqueue(new TextEncoder().encode(data));
        return true;
      } catch (e) {
        console.error("Erreur lors de l'envoi de données:", e);
        controllerClosed = true; // Marquer comme fermé si une erreur se produit
        return false;
      }
    }
    return false;
  };
  
  try {
    // Exécuter les tâches une par une
    for (let i = 0; i < tasks.length; i++) {
      // Ne pas continuer si le controller est déjà fermé
      if (controllerClosed) {
        console.log(`Tâche ${i} ignorée car le controller est fermé`);
        break;
      }
      
      try {
        // Attendre un peu entre chaque requête pour respecter les limites de l'API
        if (i > 0) {
          await new Promise(r => setTimeout(r, 1000));
        }
        
        // Exécuter la tâche
        results[i] = await tasks[i]();
      } catch (e) {
        console.error(`Erreur lors de l'exécution de la tâche ${i}:`, e);
        results[i] = null as any;
      }
    }
    
    // Une fois toutes les tâches terminées, fermer le controller
    // avec un petit délai pour s'assurer que toutes les données sont envoyées
    if (!controllerClosed) {
      console.log('Toutes les tâches terminées, fermeture programmée du stream');
      setTimeout(safeCloseController, 1000);
    }
  } catch (e) {
    console.error("Erreur globale:", e);
  }
  
  return results;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get('query');
  
  if (!query || query.trim().length === 0) {
    return new Response('{"error":"La question est requise"}', { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const allPrompts = prompts(query);
      
      const fields = Object.entries(allPrompts);
      console.log(`Lancement de ${fields.length} requêtes à Mistral pour la question: ${query}`);
      
      // Créer les tâches
      const tasks = fields.map(([field, prompt]) => {
        return async () => {
          try {
            console.log(`Requête pour le champ "${field}" envoyée à Mistral...`);
            const content = await askMistral(prompt);
            console.log(`Réponse reçue pour "${field}", traitement...`);
            
            let value: any = cleanText(content);
            
            // Parsing selon le champ
            if (field === 'exposition') value = parseExposition(content);
            if (field === 'sources') value = parseSources(content);
            if (field === 'images') value = parseImages(content);
            if (field === 'keywords') value = parseKeywords(content);
            
            // Envoyer le résultat au client
            const data = JSON.stringify({ [field]: value });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            console.log(`Champ "${field}" envoyé au client`);
            return { field, success: true };
          } catch (e) {
            console.error(`Erreur pour le champ "${field}":`, e);
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Erreur pour ${field}: ${(e as Error).message}` })}\n\n`));
              return { field, success: false, error: e };
            } catch (enqueueError) {
              console.error(`Impossible d'envoyer l'erreur pour "${field}":`, enqueueError);
              return { field, success: false, error: e };
            }
          }
        };
      });
      
      // Exécuter les tâches une par une pour éviter les erreurs 429
      // La fermeture du controller est gérée dans executeTasksSequentially
      await executeTasksSequentially(tasks, controller);
    }
  });

  return new Response(stream, { headers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, category } = body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response('{"error":"La question est requise"}', { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Pour la compatibilité avec le code existant qui utilise POST
    // Rediriger vers la version GET qui utilise SSE
    return Response.redirect(`${req.nextUrl.origin}/api/search?query=${encodeURIComponent(query)}`);
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Une erreur est survenue' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 