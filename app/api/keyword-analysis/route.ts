// app/api/keyword-analysis/route.ts
import { NextResponse } from 'next/server';

const apiKey = process.env.MISTRAL_API_KEY;

export async function POST(req: Request) {
  try {
    const { prompt, model = 'mistral-tiny' } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Le prompt est requis.' }, { status: 400 });
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error?.message || 'Erreur inconnue' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ result: data.choices?.[0]?.message?.content || '' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur inconnue' }, { status: 500 });
  }
}
