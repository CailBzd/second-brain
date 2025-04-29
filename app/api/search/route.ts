import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// Documentation des modèles Mistral disponibles
const MISTRAL_MODELS = {
  // Modèles gratuits
  'mistral-tiny': {
    name: 'Mistral Tiny',
    description: 'Modèle léger pour des tâches simples',
    maxTokens: 1000,
    isFree: true
  },
  'mistral-small': {
    name: 'Mistral Small',
    description: 'Modèle équilibré pour la plupart des tâches',
    maxTokens: 2000,
    isFree: true
  },
  // Modèles payants
  'mistral-medium': {
    name: 'Mistral Medium',
    description: 'Modèle performant pour des tâches complexes',
    maxTokens: 4000,
    isFree: false
  },
  'mistral-large': {
    name: 'Mistral Large',
    description: 'Modèle le plus puissant pour des tâches exigeantes',
    maxTokens: 8000,
    isFree: false
  }
} as const;

type MistralModel = keyof typeof MISTRAL_MODELS;

// Détection simple de la langue (anglais/français)
function detectLanguage(text: string): 'fr' | 'en' {
  // Si présence de mots anglais courants ou peu de caractères accentués, on suppose anglais
  const EN_WORDS = ['the', 'and', 'is', 'in', 'of', 'to', 'for', 'with', 'on', 'as', 'by', 'an', 'be', 'this', 'that'];
  const FR_ACCENTS = /[éèêëàâäîïôöùûüçœæ]/i;
  const lower = text.toLowerCase();
  const hasEn = EN_WORDS.some(w => lower.includes(` ${w} `));
  const hasFr = FR_ACCENTS.test(text);
  if (hasEn && !hasFr) return 'en';
  if (hasFr && !hasEn) return 'fr';
  // Fallback : si plus de mots anglais que d'accents, anglais, sinon français
  return (hasEn ? 'en' : 'fr');
}

// Génération dynamique du prompt selon la langue détectée
const prompts = (query: string) => {
  // Si le prompt contient déjà une consigne de langue, on ne modifie rien
  const explicitLang = /en anglais|in english|en français|in french/i.test(query);
  const lang = explicitLang ? null : detectLanguage(query);

  // Prompts en anglais
  if (lang === 'en') {
    return {
      title: `Give me a catchy title (max 5-10 words) for: ${query}`,
      summary: `Summarize in 3 lines: ${query}`,
      historicalContext: `Give me 3 historical milestones (dates or key periods, max 4 lines) for: ${query}`,
      anecdote: `Give me a historical anecdote (max 3 lines) about: ${query}`,
      exposition: `Write a structured essay about: ${query}
Introduction (max 3 lines)
Paragraph 1 - Philosophical Approach (8-10 lines)
Paragraph 2 - Critical Analysis (8-10 lines)
Paragraph 3 - Contemporary Perspective (8-10 lines)
Conclusion (max 3 lines)`,
      sources: `Give me 3 reliable sources (format: url - short title) for: ${query}`,
      images: `Give me 3 royalty-free images (format: url - short description) for: ${query}`,
      keywords: `Give me 3 relevant keywords (comma separated, max 15 characters each) for: ${query}`,
    };
  }
  // Prompts en français (défaut)
  return {
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
  };
};

async function askMistral(prompt: string, model: MistralModel = 'mistral-tiny'): Promise<string> {
  try {
    console.log(`🔄 Appel à Mistral avec le modèle ${model}`);
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: MISTRAL_MODELS[model].maxTokens,
        top_p: 0.9
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur Mistral AI (${response.status}): ${errorData.error?.message || 'Erreur inconnue'}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error("Erreur lors de l'appel à Mistral:", error);
    throw error;
  }
}

// Utilitaire pour nettoyer le texte
function cleanText(text: string): string {
  return text.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

function parseExposition(content: string) {
  try {
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
  } catch (error) {
    console.error("Erreur lors du parsing de l'exposé:", error);
    return {
      introduction: "",
      paragraphs: [],
      conclusion: ""
    };
  }
}

function parseSources(content: string) {
  try {
    return content.split('\n')
      .map(line => {
        const match = line.match(/(?:\d+\.\s*)?(https?:\/\/[^\s]+)\s*-\s*(.*)$/);
        return match ? { url: match[1].trim(), title: cleanText(match[2]) } : null;
      })
      .filter((s): s is { url: string; title: string } => !!s);
  } catch (error) {
    console.error("Erreur lors du parsing des sources:", error);
    return [];
  }
}

function parseImages(content: string) {
  try {
    return content.split('\n')
      .map(line => {
        const match = line.match(/(?:\d+\.\s*)?(https?:\/\/[^\s]+)\s*-\s*(.*)$/);
        return match ? { url: match[1].trim(), description: cleanText(match[2]) } : null;
      })
      .filter((img): img is { url: string; description: string } => !!img);
  } catch (error) {
    console.error("Erreur lors du parsing des images:", error);
    return [];
  }
}

function parseKeywords(content: string) {
  try {
    return content.split(',')
      .map(k => cleanText(k))
      .filter(Boolean);
  } catch (error) {
    console.error("Erreur lors du parsing des mots-clés:", error);
    return [];
  }
}

// NOUVELLE APPROCHE: API REST avec un endpoint pour chaque champ
// Le frontend fera des requêtes individuelles par champ

export async function GET(req: NextRequest) {
  // Récupérer le type de champ et la requête depuis les paramètres
  const url = new URL(req.url);
  const field = url.searchParams.get('field');
  const query = url.searchParams.get('query');
  const model = url.searchParams.get('model') as MistralModel || 'mistral-tiny';
  
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'La question est requise' }, { status: 400 });
  }

  // Vérifier si le modèle est valide
  if (!MISTRAL_MODELS[model]) {
    return NextResponse.json(
      { error: `Modèle invalide. Modèles disponibles: ${Object.keys(MISTRAL_MODELS).join(', ')}` },
      { status: 400 }
    );
  }
  
  // Si aucun champ n'est spécifié, retourner la liste des champs disponibles
  if (!field) {
    return NextResponse.json({
      availableFields: Object.keys(prompts(query)),
      query,
      availableModels: Object.entries(MISTRAL_MODELS).map(([key, value]) => ({
        id: key,
        name: value.name,
        description: value.description,
        isFree: value.isFree
      }))
    });
  }
  
  const allPrompts = prompts(query);
  
  // Vérifier si le champ demandé existe
  if (!Object.keys(allPrompts).includes(field)) {
    return NextResponse.json({ error: 'Champ invalide' }, { status: 400 });
  }
  
  try {
    console.log(`Requête pour le champ "${field}" avec la question: ${query} (modèle: ${model})`);
    
    // Récupérer le prompt pour ce champ
    const prompt = allPrompts[field as keyof typeof allPrompts];
    
    // Appeler Mistral
    console.log(`Envoi de la requête à Mistral pour le champ "${field}"...`);
    const content = await askMistral(prompt, model);
    console.log(`Réponse reçue de Mistral pour "${field}", traitement...`);
    
    // Traiter la réponse selon le type de champ
    let result;
    switch (field) {
      case 'title':
      case 'summary':
      case 'historicalContext':
      case 'anecdote':
        result = cleanText(content);
        break;
      case 'exposition':
        result = parseExposition(content);
        break;
      case 'sources':
        result = parseSources(content);
        break;
      case 'images':
        result = parseImages(content);
        if (!result || result.length === 0) {
          result = [
            { url: '/image-non-disponible.svg', description: 'Image non disponible' },
            { url: '/image-non-disponible.svg', description: 'Image non disponible' },
            { url: '/image-non-disponible.svg', description: 'Image non disponible' }
          ];
        }
        break;
      case 'keywords':
        result = parseKeywords(content);
        break;
      default:
        result = content;
    }
    
    console.log(`Champ "${field}" traité avec succès`);

    // Sauvegarder dans l'historique avec Supabase
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      );
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1]);
        if (user) {
          // Préparer les données à sauvegarder
          const historyData = {
            user_id: user.id,
            query: query,
            [field]: result,
            model_info: {
              name: MISTRAL_MODELS[model].name,
              isFree: MISTRAL_MODELS[model].isFree,
              timestamp: new Date().toISOString(),
              field: field
            }
          };

          // Insérer ou mettre à jour (le trigger s'occupera de la fusion)
          const { error: insertError } = await supabase
            .from('search_history')
            .insert(historyData);

          if (insertError) {
            console.error("Erreur lors de la sauvegarde dans l'historique:", insertError);
            // On continue même si la sauvegarde échoue
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde dans l'historique:", error);
      // On continue même si la sauvegarde échoue
    }

    return NextResponse.json({ 
      [field]: result,
      model: {
        name: MISTRAL_MODELS[model].name,
        isFree: MISTRAL_MODELS[model].isFree
      }
    });
    
  } catch (error) {
    console.error(`Erreur lors du traitement du champ "${field}":`, error);
    return NextResponse.json({ 
      error: `Erreur pour ${field}: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'La question est requise' }, { status: 400 });
    }
    
    // Rediriger vers la méthode GET pour la rétrocompatibilité
    const url = new URL(req.url);
    url.searchParams.set('query', query);
    
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Une erreur est survenue' 
    }, { status: 500 });
  }
} 