import { NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  summary: string;
  historicalContext: string;
  anecdote: string;
  exposition: {
    introduction: string;
    paragraphs: string[];
    conclusion: string;
  };
  sources: Array<{ url: string; title: string }>;
  images: Array<{ url: string; description: string }>;
  keywords: string[];
}

const CATEGORIES = {
  INTRO: 'introduction',
  CONTEXT: 'context',
  EXPOSITION: 'exposition',
  CONCLUSION: 'conclusion'
} as const;

type Category = typeof CATEGORIES[keyof typeof CATEGORIES];

export async function POST(request: Request) {
  try {
    const { query, category } = await request.json();
    console.log('Requête reçue:', { query, category });

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'La question est requise et doit être une chaîne de caractères non vide' },
        { status: 400 }
      );
    }

    if (!category || !Object.values(CATEGORIES).includes(category)) {
      return NextResponse.json(
        { error: 'Catégorie invalide ou manquante' },
        { status: 400 }
      );
    }

    const prompts = {
      [CATEGORIES.INTRO]: `
        Je vais te poser une question et je veux que tu me répondes en français pour la partie introduction.
        
        Question: ${query}

        FORMAT EXACT À SUIVRE:

        TITRE:
        [DEBUT]
        Un titre unique et accrocheur en 5-10 mots maximum
        [FIN]

        RÉSUMÉ:
        [DEBUT]
        Exactement 3 lignes de résumé.
        Pas plus, pas moins.
        Le résumé doit être concis et informatif.
        [FIN]
      `,
      [CATEGORIES.CONTEXT]: `
        Je vais te poser une question et je veux que tu me répondes en français pour le contexte historique.
        
        Question: ${query}

        FORMAT EXACT À SUIVRE:

        REPÈRES HISTORIQUES:
        [DEBUT]
        Exactement 3 dates ou périodes clés.
        Chaque date avec un fait historique précis.
        Maximum 4 lignes au total.
        [FIN]

        ANECDOTE:
        [DEBUT]
        Une seule anecdote historique intéressante.
        Maximum 3 lignes.
        [FIN]
      `,
      [CATEGORIES.EXPOSITION]: `
        Je vais te poser une question et je veux que tu me répondes en français pour l'exposé principal.
        
        Question: ${query}

        FORMAT EXACT À SUIVRE:

        Introduction:
        [DEBUT]
        Présentation du sujet en 3 lignes maximum.
        Annonce claire du plan.
        Pas de formules de politesse.
        [FIN]

        Paragraphe 1 - Approche Philosophique:
        [DEBUT]
        Développement philosophique en 8-10 lignes.
        Arguments clairs et structurés.
        Pas de répétitions.
        [FIN]

        Paragraphe 2 - Analyse Critique:
        [DEBUT]
        Analyse critique en 8-10 lignes.
        Points positifs et négatifs.
        Arguments différents du premier paragraphe.
        [FIN]

        Paragraphe 3 - Perspective Contemporaine:
        [DEBUT]
        Vision moderne en 8-10 lignes.
        Enjeux actuels.
        Tendances futures.
        [FIN]
      `,
      [CATEGORIES.CONCLUSION]: `
        Je vais te poser une question et je veux que tu me répondes en français pour la conclusion.
        IMPORTANT: Pour les images, utilise UNIQUEMENT des URLs d'images réelles et existantes, pas de placeholders.
        
        Question: ${query}

        FORMAT EXACT À SUIVRE:

        Conclusion:
        [DEBUT]
        Synthèse en 3 lignes maximum.
        Points clés uniquement.
        Pas de nouvelles idées.
        [FIN]

        SOURCES:
        [DEBUT]
        1. https://source1.com - Titre précis de la source 1 (25 caractères max)
        2. https://source2.com - Titre précis de la source 2 (25 caractères max)
        3. https://source3.com - Titre précis de la source 3 (25 caractères max)
        [FIN]

        IMAGES:
        [DEBUT]
        1. https://upload.wikimedia.org/wikipedia/commons/thumb/... - Description courte image 1 (15 mots max)
        2. https://commons.wikimedia.org/wiki/File/... - Description courte image 2 (15 mots max)
        3. https://images.pexels.com/photos/... - Description courte image 3 (15 mots max)
        [FIN]

        MOTS-CLÉS:
        [DEBUT]
        mot-clé1, mot-clé2, mot-clé3 (chaque mot-clé: 15 caractères maximum)
        [FIN]
      `
    };

    const selectedPrompt = prompts[category as Category];
    console.log('Envoi de la requête à Mistral AI...');
    
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: selectedPrompt }],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur Mistral AI:', errorData);
      throw new Error(
        `Erreur Mistral AI (${response.status}): ${errorData.error?.message || 'Erreur inconnue'}`
      );
    }

    const data = await response.json();
    console.log('Réponse Mistral AI:', data);
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Réponse invalide:', data);
      throw new Error('Réponse invalide de Mistral AI');
    }

    const content = data.choices[0].message.content;
    console.log('Contenu de la réponse:', content);

    // Fonction d'extraction améliorée
    const extractSection = (content: string, sectionName: string) => {
      const regex = new RegExp(`${sectionName}:(?:[^\\[]*\\[DEBUT\\]\\s*)([\\s\\S]*?)\\s*\\[FIN\\]`, 'i');
      const match = content.match(regex);
      return match ? match[1].trim() : '';
    };

    // Extraction des paragraphes avec une approche plus précise
    const extractParagraphs = (text: string) => {
      const paragraphsContent = extractSection(text, 'Paragraphe 1 - Approche Philosophique') + '\n\n' +
                               extractSection(text, 'Paragraphe 2 - Analyse Critique') + '\n\n' +
                               extractSection(text, 'Paragraphe 3 - Perspective Contemporaine');
      
      return paragraphsContent
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
    };

    // Extraction des images avec une approche plus précise
    const extractImages = (content: string) => {
      const imagesSection = extractSection(content, 'IMAGES');
      return imagesSection
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.match(/^\d+\./))
        .map(line => {
          const match = line.match(/^\d+\.\s*(https?:\/\/[^\s]+)\s*-\s*(.*)$/);
          return match ? { 
            url: match[1].trim(),
            description: match[2].trim()
          } : null;
        })
        .filter((image): image is { url: string; description: string } => image !== null);
    };

    let result: Partial<SearchResult> = {};

    switch (category) {
      case CATEGORIES.INTRO:
        result = {
          title: extractSection(content, 'TITRE'),
          summary: extractSection(content, 'RÉSUMÉ')
        };
        break;

      case CATEGORIES.CONTEXT:
        result = {
          historicalContext: extractSection(content, 'REPÈRES HISTORIQUES'),
          anecdote: extractSection(content, 'ANECDOTE')
        };
        break;

      case CATEGORIES.EXPOSITION:
        const paragraphs = extractParagraphs(content);
        result = {
          exposition: {
            introduction: extractSection(content, 'Introduction'),
            paragraphs: paragraphs.length === 3 ? paragraphs : ['', '', ''],
            conclusion: ''
          }
        };
        break;

      case CATEGORIES.CONCLUSION:
        result = {
          exposition: {
            introduction: '',
            paragraphs: [],
            conclusion: extractSection(content, 'Conclusion')
          },
          sources: extractSection(content, 'SOURCES')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.match(/^\d+\./))
            .map(line => {
              const match = line.match(/^\d+\.\s*(https?:\/\/[^\s]+)\s*-\s*(.*)$/);
              return match ? { url: match[1].trim(), title: match[2].trim() } : null;
            })
            .filter((source): source is { url: string; title: string } => source !== null),
          images: extractImages(content),
          keywords: extractSection(content, 'MOTS-CLÉS')
            .split(',')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword.length > 0)
        };

        // Ensure we have at least 3 items for sources, images, and keywords
        if (result.sources && result.sources.length < 3) {
          result.sources = result.sources.concat(
            Array(3 - result.sources.length).fill({ url: '', title: '' })
          );
        }

        if (result.images && result.images.length < 3) {
          result.images = result.images.concat(
            Array(3 - result.images.length).fill({ url: '', description: '' })
          );
        }

        if (result.keywords && result.keywords.length < 3) {
          result.keywords = result.keywords.concat(
            Array(3 - result.keywords.length).fill('')
          );
        }
        break;
    }

    console.log('Résultat final:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors de la recherche',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 