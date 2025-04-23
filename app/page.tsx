"use client";

import { useState } from 'react';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';

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

const CATEGORIES = {
  INTRO: 'introduction',
  CONTEXT: 'context',
  EXPOSITION: 'exposition',
  CONCLUSION: 'conclusion'
} as const;

type Category = typeof CATEGORIES[keyof typeof CATEGORIES];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category>(CATEGORIES.INTRO);
  const [searchResult, setSearchResult] = useState<SearchResult>({});
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const processCategory = async (query: string, category: Category): Promise<boolean> => {
    setCurrentCategory(category);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, category }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Une erreur est survenue');
      }

      const data = await response.json();
      setSearchResult(prevResult => ({
        ...prevResult,
        ...data
      }));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return false;
    }
  };

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setSearchResult({});
    setProgress(0);

    const categories = Object.values(CATEGORIES);
    const totalSteps = categories.length;

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i] as Category;
      const success = await processCategory(query, category);
      
      if (!success) {
        setIsLoading(false);
        return;
      }

      setProgress(((i + 1) / totalSteps) * 100);
    }

    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Second Brain
        </h1>
        
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        
        {isLoading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Génération en cours... {Math.round(progress)}%
              </span>
              <span className="text-sm font-medium text-gray-700">
                {currentCategory === 'introduction' && 'Introduction'}
                {currentCategory === 'context' && 'Contexte historique'}
                {currentCategory === 'exposition' && 'Exposé principal'}
                {currentCategory === 'conclusion' && 'Conclusion et références'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <SearchResults 
          result={searchResult} 
          isLoading={isLoading}
          currentCategory={currentCategory}
        />
      </div>
    </main>
  );
}
