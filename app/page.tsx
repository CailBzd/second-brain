"use client";

import { useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { SearchResults } from '@/components/SearchResults';

export default function Home() {
  const [result, setResult] = useState(null);

  const handleSearch = async (query: string) => {
    try {
      console.log('Envoi de la requête:', query);
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur de réponse:', errorData);
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      console.log('Données reçues:', data);
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Une erreur est survenue lors de la recherche');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Assistant de Recherche Mistral AI
      </h1>
      
      <div className="max-w-2xl mx-auto">
        <SearchForm onSubmit={handleSearch} />
        <div className="mt-8">
          <SearchResults result={result} />
        </div>
      </div>
    </main>
  );
}
