'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { selectSearchHistoryByUser, deleteSearchHistoryById } from '@/lib/supabase';
import { debounce } from 'lodash';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<SearchHistory[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
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
        setFilteredHistory(data || []);
      } catch (error) {
        // Erreur silencieuse
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [router, supabase]);

  // Appliquer le filtre de recherche
  const filterHistory = useCallback(
    debounce((term: string) => {
      if (!term.trim()) {
        setFilteredHistory(history);
        return;
      }
      
      const filtered = history.filter(item => 
        item.query.toLowerCase().includes(term.toLowerCase()) || 
        (item.title?.toLowerCase().includes(term.toLowerCase())) ||
        (item.summary?.toLowerCase().includes(term.toLowerCase())) ||
        (item.keywords?.some(k => k.toLowerCase().includes(term.toLowerCase())))
      );
      setFilteredHistory(filtered);
    }, 300),
    [history]
  );

  // Mettre à jour les résultats filtrés lorsque le terme de recherche change
  useEffect(() => {
    filterHistory(searchTerm);
  }, [searchTerm, filterHistory]);

  // Mettre à jour les résultats filtrés lorsque l'ordre de tri change
  useEffect(() => {
    const sorted = [...filteredHistory].sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });
    setFilteredHistory(sorted);
  }, [sortOrder]);

  const handleReloadSearch = (item: SearchHistory) => {
    localStorage.setItem('reloadedSearch', JSON.stringify(item));
    router.push(`/?q=${encodeURIComponent(item.query)}`);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await deleteSearchHistoryById(id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      const updatedHistory = history.filter(h => h.id !== id);
      setHistory(updatedHistory);
      setFilteredHistory(filteredHistory.filter(h => h.id !== id));
      setDeleteConfirmId(null);
      
      // Animation de suppression
      const element = document.getElementById(`history-item-${id}`);
      if (element) {
        element.classList.add('scale-0', 'opacity-0');
        setTimeout(() => {
          // La suppression de l'état est déjà effectuée
        }, 300);
      }
    } catch (err) {
      // Erreur silencieuse
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-gray-600">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* En-tête */}
          <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <h1 className="text-3xl font-bold">Historique des recherches</h1>
            <p className="mt-2 opacity-80">Retrouvez et consultez vos recherches passées</p>
          </div>
          
          {/* Barre d'outils */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rechercher dans l'historique..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                >
                  <option value="newest">Plus récentes</option>
                  <option value="oldest">Plus anciennes</option>
                </select>
                
                {history.length > 0 && (
                  <button
                    onClick={() => setDeleteConfirmId('all')}
                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Tout effacer
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Liste d'historique vide */}
          {filteredHistory.length === 0 && (
            <div className="py-16 px-6 text-center">
              {searchTerm ? (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune recherche trouvée</h3>
                  <p className="mt-1 text-gray-500">Essayez avec un autre terme de recherche.</p>
                  <button 
                    className="mt-4 text-blue-600 hover:text-blue-800"
                    onClick={() => setSearchTerm('')}
                  >
                    Effacer la recherche
                  </button>
                </div>
              ) : (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune recherche dans l'historique</h3>
                  <p className="mt-1 text-gray-500">Vos recherches apparaîtront ici.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Liste d'historique */}
          {filteredHistory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {filteredHistory.map((item) => (
                <div
                  id={`history-item-${item.id}`}
                  key={item.id}
                  className={`bg-white rounded-lg border ${
                    selectedItem === item.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                  } shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden transform`}
                >
                  {/* En-tête de la carte */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-600 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(item.created_at)}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleReloadSearch(item)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                        title="Relancer cette recherche"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                            title="Confirmer la suppression"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                            title="Annuler"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="Supprimer cette recherche"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                        className="text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                        title={selectedItem === item.id ? "Réduire" : "Voir les détails"}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 transition-transform ${selectedItem === item.id ? 'rotate-180' : ''}`}
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Contenu de la carte */}
                  <div className="px-6 py-4">
                    <div className="flex flex-col space-y-3">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 line-clamp-1 hover:line-clamp-none transition-all">
                          {item.title || item.query}
                        </h3>
                        <p className="text-gray-700 mt-1 line-clamp-1">
                          <span className="font-medium text-gray-500">Requête:</span> {item.query}
                        </p>
                      </div>
                      
                      {item.summary && (
                        <div className={`${selectedItem === item.id ? '' : 'line-clamp-2'} text-gray-700 transition-all duration-300`}>
                          <span className="font-medium text-gray-500">Résumé:</span> {item.summary}
                        </div>
                      )}
                      
                      {item.keywords && item.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Contenu détaillé */}
                  {selectedItem === item.id && (
                    <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 space-y-4 animate-fadeIn">
                      {item.historical_context && (
                        <div>
                          <h4 className="font-medium text-blue-800">Contexte historique</h4>
                          <p className="mt-1 text-gray-700">{item.historical_context}</p>
                        </div>
                      )}
                      
                      {item.anecdote && (
                        <div>
                          <h4 className="font-medium text-amber-800">Anecdote</h4>
                          <p className="mt-1 text-gray-700 italic">{item.anecdote}</p>
                        </div>
                      )}
                      
                      {item.exposition && (
                        <div>
                          <h4 className="font-medium text-emerald-800">Exposé</h4>
                          
                          {item.exposition.introduction && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium text-gray-700">Introduction</h5>
                              <p className="mt-1 text-gray-600 text-sm">{item.exposition.introduction}</p>
                            </div>
                          )}
                          
                          {item.exposition.paragraphs && item.exposition.paragraphs.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium text-gray-700">Développement</h5>
                              <div className="space-y-2 mt-1">
                                {item.exposition.paragraphs.map((paragraph, index) => (
                                  <p key={index} className="text-gray-600 text-sm">{paragraph}</p>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {item.exposition.conclusion && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium text-gray-700">Conclusion</h5>
                              <p className="mt-1 text-gray-600 text-sm">{item.exposition.conclusion}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {item.sources && item.sources.length > 0 && (
                        <div>
                          <h4 className="font-medium text-purple-800">Sources</h4>
                          <ul className="mt-1 space-y-1">
                            {item.sources.map((source, index) => (
                              <li key={index}>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  {source.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de confirmation pour supprimer tout l'historique */}
      {deleteConfirmId === 'all' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Supprimer tout l'historique</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer tout votre historique de recherche ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    // Supprimer tout l'historique
                    const promises = history.map(item => deleteSearchHistoryById(item.id));
                    await Promise.all(promises);
                    
                    setHistory([]);
                    setFilteredHistory([]);
                    setDeleteConfirmId(null);
                  } catch (err) {
                    // Erreur silencieuse
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Supprimer tout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 