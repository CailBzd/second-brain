'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface SearchHistory {
  id: string;
  created_at: string;
  prompt: string;
  response: string;
}

export default function History() {
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('search_history')
          .select('*')
          .order('created_at', { ascending: false });

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
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Requête</h3>
                  <p className="mt-1 text-gray-600">{item.prompt}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Réponse</h3>
                  <p className="mt-1 text-gray-600">{item.response}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 