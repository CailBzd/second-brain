// app/api/keyword-analysis/route.ts
import { Mistral } from '@mistralai/mistralai';
import { NextResponse } from 'next/server';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: apiKey });

export async function POST(req: Request) {
  const { text } = await req.json();

  try {
    // Envoi de la requête à l'API Mistral
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: text }],
    });


    if (chatResponse.choices && chatResponse.choices.length > 0) {
      console.log('Chat:', chatResponse.choices[0].message.content);
    } else {
      console.error('Aucune réponse de choix disponible.');
    }
    
    const summary = chatResponse.choices[0].message.content;

    // Extraction des mots-clés (exemple simple ici, peut être amélioré)
    const keywords = extractKeywords(summary);

    // Limiter les mots-clés à 5
    const limitedKeywords = keywords.slice(0, 5);

    // Générer le résumé de 3 paragraphes
    const paragraphs = generateSummary(summary, 3);

    // Retour des résultats avec les sources (en exemple, tu peux ajouter des liens réels selon ton besoin)
    const sources = ["Source 1: Blog", "Source 2: Presse", "Source 3: Recherche académique"];

    return NextResponse.json({
      keywords: limitedKeywords,
      summary: paragraphs,
      sources: sources,
    });
  } catch (error) {
    return NextResponse.error();
  }
}

// Fonction d'extraction des mots-clés
function extractKeywords(text: string): string[] {
  const words = text.split(' ');
  return words.filter(word => word.length > 4); // Filtrage simple des mots de plus de 4 caractères
}

// Fonction pour générer un résumé de 3 paragraphes
function generateSummary(text: string, numParagraphs: number): string[] {
  const sentences = text.split('. ');
  const paragraphLength = Math.ceil(sentences.length / numParagraphs);

  const paragraphs: string[] = [];
  for (let i = 0; i < numParagraphs; i++) {
    const start = i * paragraphLength;
    const end = (i + 1) * paragraphLength;
    paragraphs.push(sentences.slice(start, end).join('. ') + '.');
  }

  return paragraphs;
}
