"use client";

import { SearchForm } from '@/components/SearchForm';
import { SearchResults } from '@/components/SearchResults';
import { useState, useEffect, useRef } from 'react';

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
  const [query, setQuery] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const [loadedFields, setLoadedFields] = useState<Record<string, boolean>>({});

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

  const handleSearch = (q: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setSearchResult({});
    setQuery(q);
    setLoadedFields({});
    setProgress(0);
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      const es = new EventSource(`/api/search?query=${encodeURIComponent(q)}`);
      eventSourceRef.current = es;
      
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const key = Object.keys(data)[0];
          
          if (key === 'error') {
            setError(data.error);
            return;
          }
          
          console.log('Réception du champ:', key);
          
          setLoadedFields(prev => {
            const updated = {...prev, [key]: true};
            console.log('Champs chargés:', updated);
            return updated;
          });
          
          setSearchResult(prev => {
            if (key === 'exposition') {
              return {
                ...prev,
                exposition: { ...prev.exposition, ...data[key] }
              };
            }
            
            return {
              ...prev,
              [key]: data[key]
            };
          });
          
          const totalFields = 8;
          const loadedCount = Object.keys(data).length;
          setProgress((loadedCount / totalFields) * 100);
        } catch (e) {
          console.error('Erreur de parsing SSE:', e);
          setError('Erreur de parsing: ' + (e as Error).message);
        }
      };
      
      es.onerror = (e) => {
        console.error('Erreur SSE:', e);
        setError('Erreur de connexion au serveur');
        setIsLoading(false);
      };
      
      const timeout = setTimeout(() => {
        if (eventSourceRef.current) {
          console.log('Fin du délai d\'attente, fermeture du stream');
          eventSourceRef.current.close();
          setIsLoading(false);
        }
      }, 30000);
      
      return Promise.resolve();
    } catch (e) {
      console.error('Erreur d\'initialisation SSE:', e);
      setError('Erreur: ' + (e as Error).message);
      setIsLoading(false);
      return Promise.resolve();
    }
  };

  useEffect(() => {
    const totalFields = 8;
    const loadedCount = Object.values(loadedFields).filter(Boolean).length;
    const progressValue = (loadedCount / totalFields) * 100;
    
    console.log(`Progression: ${loadedCount}/${totalFields} (${progressValue.toFixed(0)}%)`);
    setProgress(progressValue);
    
    if (loadedCount === totalFields) {
      console.log('Tous les champs sont chargés, fin du chargement');
      setIsLoading(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    }
  }, [loadedFields]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Bienvenue sur Second Brain
        </h1>
        <p className="text-xl text-gray-600">
          Votre organisateur intelligent de pensées
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        
        {isLoading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Génération en cours... {Math.round(progress)}%
              </span>
              <div className="flex flex-wrap gap-2">
                {['title', 'summary', 'historicalContext', 'anecdote', 'exposition', 'sources', 'images', 'keywords'].map(field => (
                  <span key={field} className={`text-sm px-2 py-1 rounded ${loadedFields[field] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {field === 'title' && 'Titre'}
                    {field === 'summary' && 'Résumé'}
                    {field === 'historicalContext' && 'Contexte'}
                    {field === 'anecdote' && 'Anecdote'}
                    {field === 'exposition' && 'Exposé'}
                    {field === 'sources' && 'Sources'}
                    {field === 'images' && 'Images'}
                    {field === 'keywords' && 'Mots-clés'}
                  </span>
                ))}
              </div>
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
    </div>
  );
}
