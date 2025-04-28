"use client";

import { SearchForm } from '@/components/SearchForm';
import { SearchResults } from '@/components/SearchResults';
import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

// Liste des champs à récupérer
const FIELDS = [
  'title',
  'summary',
  'historicalContext',
  'anecdote',
  'exposition',
  'sources',
  'images',
  'keywords'
];

const DEBUG = process.env.NODE_ENV === 'development';
const REQUESTS_PER_DAY = 5;
const REQUEST_COOLDOWN = 5 * 60 * 1000; // 5 minutes en millisecondes

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category>(CATEGORIES.INTRO);
  const [searchResult, setSearchResult] = useState<SearchResult>({});
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [query, setQuery] = useState<string>('');
  const [loadedFields, setLoadedFields] = useState<Record<string, boolean>>({});
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const abortControllersRef = useRef<Record<string, AbortController>>({});
  const [user, setUser] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [requestsToday, setRequestsToday] = useState<number>(0);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Vérifier d'abord si nous avons une session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error) {
            console.error('Erreur Supabase:', error);
            throw error;
          }
          
          setUser(user);
          
          // Vérifier les requêtes du jour pour les utilisateurs connectés
          const today = new Date().toISOString().split('T')[0];
          const storedRequests = localStorage.getItem(`requests_${today}`);
          if (storedRequests) {
            setRequestsToday(parseInt(storedRequests));
          }
        } else {
          // Pour les utilisateurs non connectés, vérifier le délai entre les requêtes
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

  // Fonction pour récupérer un champ spécifique
  const fetchField = async (query: string, field: string) => {
    try {
      // Créer un nouvel AbortController pour cette requête
      abortControllersRef.current[field] = new AbortController();
      
      console.log(`Récupération du champ ${field}...`);
      
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&field=${field}`, {
        signal: abortControllersRef.current[field].signal
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur lors de la récupération du champ ${field}`);
      }
      
      const data = await response.json();
      console.log(`Champ ${field} récupéré avec succès`);
      
      // Mettre à jour le résultat et marquer le champ comme chargé
      setSearchResult(prev => ({
        ...prev,
        [field]: data[field]
      }));
      
      setLoadedFields(prev => ({
        ...prev,
        [field]: true
      }));
      
      return true;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`Requête pour ${field} annulée`);
        return false;
      }
      
      console.error(`Erreur lors de la récupération du champ ${field}:`, err);
      return false;
    }
  };

  const handleSearch = async (q: string): Promise<void> => {
    // Vérifier les limites de requêtes
    if (user) {
      const today = new Date().toISOString().split('T')[0];
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
    
    // Annuler toutes les requêtes précédentes
    Object.values(abortControllersRef.current).forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        console.error("Erreur lors de l'annulation des requêtes:", e);
      }
    });
    
    abortControllersRef.current = {};
    
    try {
      // Lancer toutes les requêtes en parallèle avec un délai pour éviter les limitations de l'API
      for (let i = 0; i < FIELDS.length; i++) {
        const field = FIELDS[i];
        
        // Attendre un peu entre chaque requête pour éviter de surcharger l'API
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Ne pas attendre que la requête soit terminée pour passer à la suivante
        fetchField(q, field).catch(e => {
          console.error(`Erreur lors de la récupération du champ ${field}:`, e);
          setError(prev => prev || `Erreur: ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
        });
      }

      // Mettre à jour les compteurs
      if (user) {
        const today = new Date().toISOString().split('T')[0];
        const newCount = requestsToday + 1;
        setRequestsToday(newCount);
        localStorage.setItem(`requests_${today}`, newCount.toString());
      } else {
        localStorage.setItem('lastRequest', Date.now().toString());
        setTimeLeft(300); // 5 minutes en secondes
      }
    } catch (e: unknown) {
      console.error("Erreur globale:", e);
      setError(`Erreur: ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const totalFields = FIELDS.length;
    const loadedCount = Object.values(loadedFields).filter(Boolean).length;
    const progressValue = (loadedCount / totalFields) * 100;
    
    console.log(`Progression: ${loadedCount}/${totalFields} (${progressValue.toFixed(0)}%)`);
    setProgress(progressValue);
    
    if (loadedCount === totalFields) {
      console.log('Tous les champs sont chargés, fin du chargement');
      setIsLoading(false);
    }
  }, [loadedFields]);

  useEffect(() => {
    return () => {
      // Nettoyer les requêtes en cours lors du démontage du composant
      Object.values(abortControllersRef.current).forEach(controller => {
        try {
          controller.abort();
        } catch (e) {
          console.error("Erreur lors de l'annulation des requêtes:", e);
        }
      });
    };
  }, []);
  
  // Composant pour les indicateurs de champs
  const FieldIndicators = () => (
    <div className="flex flex-wrap gap-2 mt-4">
      {[
        { key: 'title', label: 'Titre', icon: '📝' },
        { key: 'summary', label: 'Résumé', icon: '📋' },
        { key: 'historicalContext', label: 'Contexte', icon: '🏛️' },
        { key: 'anecdote', label: 'Anecdote', icon: '💡' },
        { key: 'exposition', label: 'Exposé', icon: '📚' },
        { key: 'sources', label: 'Sources', icon: '🔗' },
        { key: 'images', label: 'Images', icon: '🖼️' },
        { key: 'keywords', label: 'Mots-clés', icon: '🏷️' }
      ].map(field => (
        <span 
          key={field.key} 
          className={`
            text-sm px-3 py-1 rounded-full flex items-center gap-1
            ${loadedFields[field.key] 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-gray-100 text-gray-500 border border-gray-200'
            }
            transition-all duration-300
          `}
          title={loadedFields[field.key] ? "Contenu généré" : "En attente de génération"}
        >
          <span>{field.icon}</span>
          <span>{field.label}</span>
          {loadedFields[field.key] && (
            <span className="text-green-600">✓</span>
          )}
        </span>
      ))}
    </div>
  );

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
            
            <FieldIndicators />
            
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
