"use client";

import { FieldIndicators } from './components/FieldIndicators';
import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { insertSearchHistory } from '@/lib/supabase';
import { 
  CATEGORIES, 
  Category, 
  FIELDS, 
  DEBUG,
  REQUESTS_PER_DAY,
  REQUEST_COOLDOWN,
  fetchField,
  formatResultsForSave,
  saveSearchHistory
} from './utils/searchUtils';
import { SearchForm } from '@/components/SearchForm';
import { SearchResults } from '@/components/SearchResults';
import { insertDailyRequest, updateDailyRequestById, selectDailyRequestByUserAndDate } from '@/lib/supabase';

interface LocalSearchResult {
  [key: string]: any;
}

interface ApiResponse {
  [key: string]: any;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category>(CATEGORIES.INTRO);
  const [searchResult, setSearchResult] = useState<LocalSearchResult>({});
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [query, setQuery] = useState<string>('');
  const [loadedFields, setLoadedFields] = useState<Record<string, boolean>>({});
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const abortControllersRef = useRef<Record<string, AbortController>>({});
  const [user, setUser] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [requestsToday, setRequestsToday] = useState<number>(0);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error) throw error;
          
          setUser(user);
          
          const today = new Date().toISOString().split('T')[0];
          
          // Nettoyer les anciennes requêtes
          const { error: cleanupError } = await getSupabaseClient()
            .from('daily_requests')
            .delete()
            .lt('request_date', today);

          if (cleanupError) {
            console.error('Erreur lors du nettoyage des anciennes requêtes:', cleanupError);
          }

          // Récupérer le compteur du jour
          let dailyRequests = null;
          let dailyError = null;
          if (user?.id) {
            const result = await selectDailyRequestByUserAndDate(user.id, today);
            dailyRequests = result.data;
            dailyError = result.error;
          }

          if (dailyError) {
            console.error('Erreur lors de la récupération des requêtes quotidiennes:', dailyError);
          } else {
            setRequestsToday(dailyRequests?.request_count || 0);
          }
        } else {
          const lastRequest = localStorage.getItem('lastRequest');
          if (lastRequest) {
            const timeSinceLastRequest = Date.now() - parseInt(lastRequest);
            const timeToWait = Math.max(0, REQUEST_COOLDOWN - timeSinceLastRequest);
            setTimeLeft(Math.ceil(timeToWait / 1000));
          }
        }
      } catch (error: any) {
        if (DEBUG) {
          console.error('Erreur détaillée:', {
            message: error.message,
            code: error.code,
            details: error.details,
            status: error.status
          });
        }
      }
    };

    checkUser();
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [supabase]);

  useEffect(() => {
    const reloadedSearch = localStorage.getItem('reloadedSearch');
    if (reloadedSearch) {
      const searchData = JSON.parse(reloadedSearch);
      setQuery(searchData.query);
      setSearchResult(searchData);
      setHasSearched(true);
      setLoadedFields(
        Object.fromEntries(
          FIELDS.map(field => [field, Boolean(searchData[field])])
        )
      );
      localStorage.removeItem('reloadedSearch');
    }
  }, []);

  const updateDailyRequests = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Vérifier si une entrée existe déjà pour aujourd'hui
      const { data: existingRequest, error: fetchError } = await selectDailyRequestByUserAndDate(userId, today);

      if (fetchError) {
        console.error('Erreur lors de la vérification des requêtes:', fetchError);
        return;
      }

      if (existingRequest) {
        // Mettre à jour le compteur existant
        const { error: updateError } = await updateDailyRequestById(existingRequest.id, {
          request_count: existingRequest.request_count + 1,
          updated_at: new Date().toISOString()
        });

        if (updateError) {
          console.error('Erreur lors de la mise à jour du compteur:', updateError);
        } else {
          setRequestsToday(prev => prev + 1);
        }
      } else {
        // Créer une nouvelle entrée
        const { error: insertError } = await insertDailyRequest({
          user_id: userId,
          request_date: today,
          request_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (insertError) {
          console.error('Erreur lors de la création du compteur:', insertError);
        } else {
          setRequestsToday(1);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des requêtes quotidiennes:', error);
    }
  };

  const handleSearch = async (q: string): Promise<void> => {
    console.log('=== Début de la recherche ===');
    console.log('Query:', q);
    
    if (user) {
      if (requestsToday >= REQUESTS_PER_DAY) {
        setError(`Limite de requêtes atteinte. Vous avez atteint la limite de ${REQUESTS_PER_DAY} requêtes par jour. Réessayez demain.`);
        return;
      }
    } else if (!DEBUG && timeLeft > 0) {
      setError(`Veuillez patienter. Vous devez attendre ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} avant de faire une nouvelle requête.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResult({});
    setQuery(q);
    setLoadedFields({});
    setProgress(0);
    setHasSearched(true);
    
    try {
      // Mettre à jour le compteur de requêtes si l'utilisateur est connecté
      if (user?.id) {
        await updateDailyRequests(user.id);
      } else if (!DEBUG) {
        localStorage.setItem('lastRequest', Date.now().toString());
      }

      let historyId: string | null = null;
      
      if (user?.id) {
        console.log('=== Création de l\'entrée historique ===');
        console.log('User ID:', user.id);
        
        const historyData = {
          user_id: user.id,
          query: q,
          created_at: new Date().toISOString()
        };

        try {
          const { data, error: historyError } = await insertSearchHistory(historyData);

          if (historyError) {
            console.error('Erreur lors de la création de l\'historique:', historyError);
            throw historyError;
          }
          if (data) {
            historyId = data.id;
            console.log('ID historique créé:', historyId);
          }
          
        } catch (e) {
          console.error('Exception lors de la création historique:', e);
        }
      }

      const allResults: Record<string, any> = { query: q };
      const localResults: Record<string, any> = {};
      
      console.log('=== Début de la récupération des champs ===');
      
      for (const field of FIELDS) {
        try {
          console.log(`Récupération du champ "${field}"...`);
          abortControllersRef.current[field] = new AbortController();
          
          const success = await fetchField(
            q,
            field,
            abortControllersRef.current[field],
            (newResult: ApiResponse | ((prev: ApiResponse) => ApiResponse)) => {
              if (typeof newResult === 'function') {
                setSearchResult(prev => {
                  const updatedResult = newResult(prev);
                  localResults[field] = updatedResult[field];
                  return updatedResult;
                });
              } else {
                localResults[field] = newResult[field];
                setSearchResult(prev => ({ ...prev, [field]: newResult[field] }));
              }
            },
            setLoadedFields
          );

          if (success && localResults[field]) {
            console.log(`Champ "${field}" récupéré avec succès:`, localResults[field]);
            allResults[field] = localResults[field];
            
            // Sauvegarder chaque champ individuellement
            if (user?.id && historyId) {
              console.log(`Sauvegarde du champ "${field}"...`);
              
              // Formater les données avant la sauvegarde
              const fieldData = {
                query: q,
                user_id: user.id,
                [field]: localResults[field]
              };

              // Pour les champs spéciaux qui nécessitent une conversion
              if (field === 'exposition' && typeof fieldData.exposition === 'object') {
                fieldData.exposition = JSON.stringify(fieldData.exposition);
              }
              if (field === 'sources' && Array.isArray(fieldData.sources)) {
                fieldData.sources = JSON.stringify(fieldData.sources);
              }
              if (field === 'images' && Array.isArray(fieldData.images)) {
                fieldData.images = JSON.stringify(fieldData.images);
              }
              if (field === 'keywords' && Array.isArray(fieldData.keywords)) {
                fieldData.keywords = JSON.stringify(fieldData.keywords);
              }

              console.log(`Données formatées pour le champ "${field}":`, fieldData);
              
              const saveSuccess = await saveSearchHistory(
                historyId,
                fieldData,
                setError
              );
              console.log(`Sauvegarde du champ "${field}":`, saveSuccess ? 'Succès' : 'Échec');
            }
          }
        } catch (e) {
          console.error(`Erreur lors de la récupération du champ "${field}":`, e);
        }
        
        // Mettre à jour la progression
        setProgress((FIELDS.indexOf(field) + 1) / FIELDS.length * 100);
      }
      
      console.log('=== Tous les champs ont été récupérés ===');
      console.log('Résultats finaux:', allResults);

    } catch (e) {
      console.error('=== Erreur globale ===');
      console.error('Type:', e instanceof Error ? 'Error' : typeof e);
      console.error('Message:', e instanceof Error ? e.message : String(e));
      console.error('Stack:', e instanceof Error ? e.stack : 'Non disponible');
      setError(`Erreur: ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const totalFields = FIELDS.length;
    const loadedCount = Object.values(loadedFields).filter(Boolean).length;
    const progressValue = (loadedCount / totalFields) * 100;
    setProgress(progressValue);
  }, [loadedFields]);

  useEffect(() => {
    return () => {
      Object.values(abortControllersRef.current).forEach(controller => {
        try {
          controller.abort();
        } catch (e) {
          console.error("Erreur lors de l'annulation des requêtes:", e);
        }
      });
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className={`transition-all duration-500 ${hasSearched ? 'mb-2' : 'mb-8'}`}>
        <div className={`text-center transition-all duration-500 ${hasSearched ? 'transform scale-75 opacity-80 hover:opacity-100' : ''}`}>
          <h1 
            className={`font-bold text-gray-900 transition-all duration-500 ${hasSearched ? 'text-2xl mb-1' : 'text-4xl mb-6'}`}
            onClick={hasSearched ? () => setHasSearched(false) : undefined}
            title={hasSearched ? "Cliquez pour restaurer" : ""}
            style={hasSearched ? { cursor: 'pointer' } : {}}
          >
            Bienvenue sur Second Brain
          </h1>
          {!hasSearched && (
            <p className="text-xl text-gray-600">
              Votre organisateur intelligent de pensées
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className={`transition-all duration-500 ${hasSearched ? 'transform scale-90 -mt-2 opacity-90 hover:opacity-100' : ''}`}>
          {user && (
            <div className="mb-4 text-sm text-gray-600">
              Requêtes restantes aujourd'hui : {REQUESTS_PER_DAY - requestsToday}
            </div>
          )}

          <SearchForm 
            onSearch={handleSearch} 
            isLoading={isLoading} 
            minimized={hasSearched}
          />

          {!user && timeLeft > 0 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Prochaine requête possible dans {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
        
        {hasSearched && (
          <div className="mt-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {isLoading ? `Génération en cours... ${Math.round(progress)}%` : 'Génération terminée'}
              </span>
              <button 
                onClick={() => setHasSearched(false)} 
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                Afficher l'en-tête complet
              </button>
            </div>
            
            <FieldIndicators 
              loadedFields={loadedFields}
              isLoading={isLoading}
            />
            
            {isLoading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
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
