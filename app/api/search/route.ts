import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    console.log('Requête reçue:', query);

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'La question est requise et doit être une chaîne de caractères non vide' },
        { status: 400 }
      );
    }

    const prompt = `
      Je vais te poser une question et je veux que tu me répondes en français et dans un format spécifique.
      IMPORTANT: Toutes tes réponses doivent être en français et concises.

      Question: ${query}

      Réponds-moi en suivant exactement ce format:

      TITRE:
      [Un titre accrocheur en 5-10 mots]

      RÉSUMÉ:
      [Un résumé concis en 2-3 lignes]

      REPÈRES HISTORIQUES:
      [3-4 lignes maximum]

      ANECDOTE:
      [2-3 lignes maximum]

      EXPOSÉ:
      Introduction:
      [3-4 lignes]

      Paragraphes:
      [Paragraphe 1: Approche philosophique (10 lignes)]
      [Paragraphe 2: Analyse critique (10 lignes)]
      [Paragraphe 3: Perspective contemporaine (10 lignes)]

      Conclusion:
      [3-4 lignes]

      SOURCES:
      Fournis 3 sources pertinentes avec des URLs.
      1. [URL] - [Titre court]
      2. [URL] - [Titre court]
      3. [URL] - [Titre court]

      IMAGES:
      Fournis 3 URLs d'images pertinentes.
      1. [URL] - [Description courte]
      2. [URL] - [Description courte]
      3. [URL] - [Description courte]

      MOTS-CLÉS:
      [3 mots-clés séparés par des virgules]
    `;

    console.log('Envoi de la requête à Mistral AI...');
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
        max_tokens: 1500,
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

    // Extraction des données avec une meilleure gestion des erreurs
    const extractSection = (content: string, sectionName: string) => {
      const regex = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n\\n[A-ZÀ-ÿ]+:|$)`, 'i');
      const match = content.match(regex);
      return match ? match[1].trim() : '';
    };

    const title = extractSection(content, 'TITRE');
    const summary = extractSection(content, 'RÉSUMÉ');
    const historicalContext = extractSection(content, 'REPÈRES HISTORIQUES');
    const anecdote = extractSection(content, 'ANECDOTE');
    
    // Extraction de l'exposé
    const expositionText = extractSection(content, 'EXPOSÉ');
    const introduction = extractSection(expositionText, 'Introduction');
    const paragraphsText = extractSection(expositionText, 'Paragraphes');
    const conclusion = extractSection(expositionText, 'Conclusion');

    // Extraction des paragraphes
    const paragraphs = paragraphsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('[') && line.endsWith(']'))
      .map(line => line.slice(1, -1).trim());

    // Extraction des sources
    const sourcesText = extractSection(content, 'SOURCES');
    const sources = sourcesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.match(/^\d+\./))
      .map(line => {
        const match = line.match(/^\d+\.\s*(https?:\/\/[^\s]+)\s*-\s*(.*)$/);
        return match ? match[1] : line.replace(/^\d+\.\s*/, '');
      });

    // Extraction des images
    const imagesText = extractSection(content, 'IMAGES');
    const images = imagesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.match(/^\d+\./))
      .map(line => {
        const match = line.match(/^\d+\.\s*(https?:\/\/[^\s]+)\s*-\s*(.*)$/);
        return match ? { url: match[1], description: match[2] } : { url: line.replace(/^\d+\.\s*/, ''), description: '' };
      });

    // Extraction des mots-clés
    const keywordsText = extractSection(content, 'MOTS-CLÉS');
    const keywords = keywordsText
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);

    const result = {
      title,
      summary,
      historicalContext,
      anecdote,
      exposition: {
        introduction,
        paragraphs,
        conclusion
      },
      sources,
      images,
      keywords
    };
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