import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, upsertSearchHistory } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { MISTRAL_MODELS, MistralModel } from '@/app/utils/searchUtils';

export const runtime = 'nodejs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Erreur silencieuse - pas de console.error
}

/**
 * Interface représentant la structure des résultats de recherche
 */
interface SearchResult {
  title?: string;
  summary?: string;
  historical_context?: string;
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

/**
 * Interface représentant une entrée dans l'historique de recherche
 */
interface SearchHistory {
  id: string;
  query: string;
  title?: string;
  summary?: string;
  historical_context?: string;
  anecdote?: string;
  exposition?: string;
  sources?: string[];
  keywords?: string[];
}

// Prompts en français uniquement
const prompts = (query: string) => ({
  title: `En français uniquement, donne-moi un titre accrocheur (10 mots max) pour : ${query}`,
  
  summary: `En français uniquement, fais un résumé synthétique en 3 lignes pour : ${query}`,
  
  historical_context: `En français uniquement, donne-moi 3 repères historiques importants (avec dates ou périodes clés, 4 lignes maximum) pour : ${query}
Format souhaité :
1. [Date/Période] - Premier repère historique
2. [Date/Période] - Deuxième repère historique
3. [Date/Période] - Troisième repère historique`,
  
  anecdote: `En français uniquement, raconte-moi une anecdote historique intéressante et peu connue (3 lignes maximum) sur : ${query}`,
  
  exposition: `En français uniquement, rédige un exposé structuré et détaillé sur : ${query}

Structure demandée :
Introduction (3 lignes maximum) :
- Présentation du sujet
- Problématique
- Annonce du plan

Paragraphe 1 - Approche Philosophique (8-10 lignes) :
- Analyse des concepts fondamentaux
- Réflexion sur les implications philosophiques

Paragraphe 2 - Analyse Critique (8-10 lignes) :
- Arguments principaux
- Contre-arguments
- Discussion des points de vue opposés

Paragraphe 3 - Perspective Contemporaine (8-10 lignes) :
- Applications actuelles
- Enjeux modernes
- Perspectives d'avenir

Conclusion (3 lignes maximum) :
- Synthèse des points clés
- Ouverture sur une réflexion plus large`,
  
  sources: `En français uniquement, donne-moi 3 sources fiables et pertinentes (en privilégiant les sources francophones) pour : ${query}
Format demandé pour chaque source : url - titre court de la source`,
  
  images: `En français uniquement, suggère-moi 3 images libres de droits pertinentes pour illustrer : ${query}
Format demandé pour chaque image : url - description courte en français`,
  
  keywords: `En français uniquement, donne-moi 3 mots-clés ou expressions clés pertinents (séparés par des virgules, maximum 15 caractères chacun) pour : ${query}`
});

/**
 * Appelle l'API Mistral pour générer une réponse à partir d'un prompt
 * @param prompt - Le texte du prompt à envoyer à Mistral
 * @param model - Le modèle Mistral à utiliser (défaut: mistral-tiny)
 * @returns La réponse générée par l'API
 */
async function askMistral(prompt: string, model: MistralModel = 'mistral-tiny'): Promise<string> {
  try {
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
    // Erreur silencieuse - pas de console.error
    throw error;
  }
}

/**
 * Nettoie un texte en supprimant les parenthèses et espaces inutiles
 * @param text - Texte à nettoyer
 * @returns Texte nettoyé
 */
function cleanText(text: string): string {
  return text.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Parse le contenu d'un exposé en extrayant introduction, paragraphes et conclusion
 * @param content - Texte de l'exposé
 * @returns Objet structuré contenant les différentes parties de l'exposé
 */
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
    // Erreur silencieuse
    return {
      introduction: "",
      paragraphs: [],
      conclusion: ""
    };
  }
}

/**
 * Parse le contenu des sources en extrayant les URLs et titres
 * @param content - Texte contenant les sources
 * @returns Tableau de sources avec URL et titre
 */
function parseSources(content: string) {
  try {
    return content.split('\n')
      .map(line => {
        const match = line.match(/(?:\d+\.\s*)?(https?:\/\/[^\s]+)\s*-\s*(.*)$/);
        return match ? { url: match[1].trim(), title: cleanText(match[2]) } : null;
      })
      .filter((s): s is { url: string; title: string } => !!s);
  } catch (error) {
    // Erreur silencieuse
    return [];
  }
}

/**
 * Parse le contenu des images en extrayant les URLs et descriptions
 * @param content - Texte contenant les descriptions d'images
 * @returns Tableau d'images avec URL et description
 */
function parseImages(content: string) {
  try {
    return content.split('\n')
      .map(line => {
        const match = line.match(/(?:\d+\.\s*)?(https?:\/\/[^\s]+)\s*-\s*(.*)$/);
        return match ? { url: match[1].trim(), description: cleanText(match[2]) } : null;
      })
      .filter((img): img is { url: string; description: string } => !!img);
  } catch (error) {
    // Erreur silencieuse
    return [];
  }
}

/**
 * Parse le contenu des mots-clés
 * @param content - Texte contenant les mots-clés séparés par des virgules
 * @returns Tableau de mots-clés nettoyés
 */
function parseKeywords(content: string) {
  try {
    return content.split(',')
      .map(k => cleanText(k))
      .filter(Boolean);
  } catch (error) {
    // Erreur silencieuse
    return [];
  }
}

/**
 * Stocke un résultat de recherche dans Supabase
 * @param query - La requête de recherche
 * @param field - Le champ concerné (title, summary, etc.)
 * @param result - Le résultat à stocker
 * @param model - Le modèle utilisé pour générer le résultat
 */
async function storeSearchResult(query: string, field: string, result: any, model: MistralModel) {
  try {
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user?.id) {
      // Utilisateur non authentifié, ignoré silencieusement
      return;
    }

    const userId = userData.user.id;

    // Vérifier si une entrée existe pour cet utilisateur et cette requête
    const { data: existingSearch, error: searchError } = await supabase
      .from('search_history')
      .select('id')
      .eq('user_id', userId)
      .eq('query', query)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      // Erreur silencieuse
      return;
    }

    // Si aucune entrée n'existe, le client devra gérer l'insertion
    if (!existingSearch) {
      return;
    }

    // Préparer les données pour l'upsert
    const searchData = {
      id: existingSearch.id,
      user_id: userId,
      query: query,
      [field]: result,
      updated_at: new Date().toISOString()
    };

    // Utiliser upsert avec l'ID existant
    const { error: upsertError } = await upsertSearchHistory(searchData);
    
    if (upsertError) {
      // Erreur silencieuse
      return;
    }
  } catch (error) {
    // Erreur silencieuse
  }
}

// NOUVELLE APPROCHE: API REST avec un endpoint pour chaque champ
// Le frontend fera des requêtes individuelles par champ

/**
 * Gestionnaire GET pour l'API de recherche
 * Récupère un champ spécifique à partir de l'API Mistral
 */
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
    // Récupérer le prompt pour ce champ
    const prompt = allPrompts[field as keyof typeof allPrompts];
    
    // Ajouter un délai aléatoire entre 1 et 3 secondes pour éviter les rate limits
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Appeler Mistral avec retry en cas d'erreur 429
    let retries = 3;
    let content = '';
    
    while (retries > 0) {
      try {
        content = await askMistral(prompt, model);
        break;
      } catch (error: any) {
        if (error.message?.includes('429') && retries > 1) {
          retries--;
          const waitTime = (4 - retries) * 2000; // Attente progressive : 2s, 4s, 6s
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw error;
        }
      }
    }
    
    // Traiter la réponse selon le type de champ
    let result;
    switch (field) {
      case 'title':
      case 'summary':
      case 'historical_context':
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

    // Store the result in Supabase
    await storeSearchResult(query, field, result, model);

    // Return the result
    return NextResponse.json({ 
      [field]: result,
      model: {
        name: MISTRAL_MODELS[model].name,
        isFree: MISTRAL_MODELS[model].isFree
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: `Erreur pour ${field}: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
    }, { status: 500 });
  }
}

/**
 * Gestionnaire POST pour l'API de recherche
 * Redirige vers la méthode GET pour la rétrocompatibilité
 */
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
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Une erreur est survenue' 
    }, { status: 500 });
  }
} 