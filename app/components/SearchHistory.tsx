import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { deleteSearchHistoryById, selectSearchHistoryByUser } from '@/lib/supabase';

interface HistoryItem {
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

export function SearchHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Vous devez être connecté pour voir votre historique");
          return;
        }

        const { data, error } = await selectSearchHistoryByUser(user.id);

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'historique:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [supabase]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        Aucune recherche dans l'historique
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Historique des recherches
      </h2>
      <div className="grid gap-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {item.title || item.query}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(item.created_at)}
                </p>
                {item.summary && (
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                    {item.summary}
                  </p>
                )}
              </div>
              <button
                onClick={async () => {
                  try {
                    const { error } = await deleteSearchHistoryById(item.id);
                    
                    if (error) throw error;
                    setHistory(history.filter(h => h.id !== item.id));
                  } catch (err) {
                    console.error('Erreur lors de la suppression:', err);
                    setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
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
        ))}
      </div>
    </div>
  );
} 