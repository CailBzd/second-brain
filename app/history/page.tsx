'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { selectSearchHistoryByUser, deleteSearchHistoryById } from '@/lib/supabase';

interface SearchHistory {
  id: string;
  created_at: string;
  query: string;
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
  model_info?: any;
}

export default function History() {
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await selectSearchHistoryByUser(user.id);

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [router, supabase]);

  const handleReloadSearch = (item: SearchHistory) => {
    // Stocker les résultats dans le localStorage pour les récupérer sur la page principale
    localStorage.setItem('reloadedSearch', JSON.stringify(item));
    router.push(`/?q=${encodeURIComponent(item.query)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement de l'historique...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Historique des recherches</h1>

      {history.length === 0 ? (
        <div className="text-center text-gray-500">
          Aucune recherche n'a été effectuée.
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleReloadSearch(item)}
                    className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    title="Recharger cette recherche"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const { error } = await deleteSearchHistoryById(item.id);
                        
                        if (error) throw error;
                        setHistory(history.filter(h => h.id !== item.id));
                      } catch (err) {
                        console.error('Erreur lors de la suppression:', err);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Requête</h3>
                  <p className="mt-1 text-gray-600">{item.query}</p>
                </div>
                {item.title && (
                  <div>
                    <h3 className="font-medium text-gray-900">Titre</h3>
                    <p className="mt-1 text-gray-600">{item.title}</p>
                  </div>
                )}
                {item.summary && (
                  <div>
                    <h3 className="font-medium text-gray-900">Résumé</h3>
                    <p className="mt-1 text-gray-600">{item.summary}</p>
                  </div>
                )}
                {item.historical_context && (
                  <div>
                    <h3 className="font-medium text-gray-900">Contexte historique</h3>
                    <p className="mt-1 text-gray-600">{item.historical_context}</p>
                  </div>
                )}
                {item.anecdote && (
                  <div>
                    <h3 className="font-medium text-gray-900">Anecdote</h3>
                    <p className="mt-1 text-gray-600">{item.anecdote}</p>
                  </div>
                )}
                {item.exposition && (
                  <div>
                    <h3 className="font-medium text-gray-900">Exposé</h3>
                    {item.exposition.introduction && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700">Introduction</h4>
                        <p className="mt-1 text-gray-600">{item.exposition.introduction}</p>
                      </div>
                    )}
                    {item.exposition.paragraphs && item.exposition.paragraphs.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700">Développement</h4>
                        {item.exposition.paragraphs.map((paragraph, index) => (
                          <p key={index} className="mt-1 text-gray-600">{paragraph}</p>
                        ))}
                      </div>
                    )}
                    {item.exposition.conclusion && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700">Conclusion</h4>
                        <p className="mt-1 text-gray-600">{item.exposition.conclusion}</p>
                      </div>
                    )}
                  </div>
                )}
                {item.sources && item.sources.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900">Sources</h3>
                    <ul className="mt-1 space-y-1">
                      {item.sources.map((source, index) => (
                        <li key={index}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.keywords && item.keywords.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900">Mots-clés</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {item.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 