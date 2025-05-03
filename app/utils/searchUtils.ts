import { getSupabaseClient, insertSearchHistory, updateSearchHistoryById } from '@/lib/supabase';

/**
 * Interface représentant les résultats de recherche structurés
 * avec tous les champs possibles retournés par l'API Mistral
 */
export interface SearchResult {
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
  [key: string]: any;
}

/**
 * Catégories de contenu pour l'organisation de l'exposé
 */
export const CATEGORIES = {
  INTRO: 'introduction',
  CONTEXT: 'context',
  EXPOSITION: 'exposition',
  CONCLUSION: 'conclusion'
} as const;

export type Category = typeof CATEGORIES[keyof typeof CATEGORIES];

/**
 * Liste des champs disponibles pour la recherche
 */
export const FIELDS = [
  'title',
  'summary',
  'historical_context',
  'anecdote',
  'exposition',
  'sources',
  'images',
  'keywords'
];

export const DEBUG = process.env.NODE_ENV === 'development';
export const REQUESTS_PER_DAY = 5;
export const REQUEST_COOLDOWN = 5 * 60 * 1000; // 5 minutes en millisecondes

/**
 * Convertit une chaîne en snake_case pour compatibilité avec la base de données
 * @param str - Chaîne à convertir
 * @returns Chaîne au format snake_case
 */
export const convertToSnakeCase = (str: string) => 
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

/**
 * Formate les résultats pour la sauvegarde en base de données
 * Convertit les clés en snake_case et ajoute des métadonnées
 * @param allResults - Résultats à formater
 * @returns Données formatées pour la sauvegarde
 */
export const formatResultsForSave = (allResults: Record<string, any>) => {
  const formattedResults = Object.entries(allResults).reduce((acc, [key, value]) => {
    if (key === 'query') return acc;
    const snakeCaseKey = convertToSnakeCase(key);
    return {
      ...acc,
      [snakeCaseKey]: value
    };
  }, {});

  return {
    ...formattedResults,
    model_info: {
      name: 'Mistral API',
      timestamp: new Date().toISOString(),
      fields: Object.keys(formattedResults)
    }
  };
};

/**
 * Récupère un champ spécifique depuis l'API de recherche
 * @param query - Requête de recherche
 * @param field - Champ à récupérer (title, summary, etc.)
 * @param abortController - Contrôleur pour annuler la requête si nécessaire
 * @param setSearchResult - Fonction pour mettre à jour les résultats
 * @param setLoadedFields - Fonction pour mettre à jour les champs chargés
 * @returns true si le champ a été récupéré avec succès, false sinon
 */
export const fetchField = async (
  query: string, 
  field: string,
  abortController: AbortController,
  setSearchResult: (value: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void,
  setLoadedFields: (value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void
) => {
  try {
    // Requête à l'API
    const response = await fetch(
      `/api/search?query=${encodeURIComponent(query)}&field=${field}`,
      { signal: abortController.signal }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur lors de la récupération du champ ${field}`);
    }
    
    const data = await response.json();
    
    if (!data[field]) {
      throw new Error(`Données manquantes pour le champ ${field}`);
    }
    
    // Mise à jour des états
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
      // Requête annulée volontairement, pas une erreur
      return false;
    }
    
    // Autres erreurs
    return false;
  }
};

/**
 * Sauvegarde les résultats de recherche dans l'historique Supabase
 * Gère la validation des données et le formatage approprié pour la base
 * @param historyId - ID de l'historique à mettre à jour
 * @param dataToSave - Données à sauvegarder
 * @param setError - Fonction pour signaler les erreurs à l'UI
 * @returns true si la sauvegarde a réussi, false sinon
 */
export const saveSearchHistory = async (
  historyId: string,
  dataToSave: Record<string, any>,
  setError: (error: string | null) => void
) => {
  const supabase = getSupabaseClient();
  
  try {
    // Vérifier la session utilisateur
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Session utilisateur non trouvée');
    }

    // Préparer les données pour la mise à jour
    const updateData = { ...dataToSave };
    delete updateData.id; // Supprimer l'ID s'il existe
    
    // Pour les champs spéciaux, s'assurer qu'ils sont au bon format
    // exposition (objet → JSONB)
    if (updateData.exposition) {
      if (typeof updateData.exposition === 'string') {
        try {
          updateData.exposition = JSON.parse(updateData.exposition);
        } catch (e) {
          // Erreur silencieuse, on continue
        }
      } else if (typeof updateData.exposition === 'object') {
        // Déjà un objet, s'assurer qu'il peut être converti en JSON
        try {
          const test = JSON.stringify(updateData.exposition);
          // Si pas d'erreur, on est bon
        } catch (e) {
          updateData.exposition = null;
        }
      }
    }
    
    // sources (tableau → JSONB)
    if (updateData.sources) {
      if (typeof updateData.sources === 'string') {
        try {
          updateData.sources = JSON.parse(updateData.sources);
        } catch (e) {
          // Erreur silencieuse, on continue
        }
      } else if (Array.isArray(updateData.sources)) {
        // C'est déjà un tableau, s'assurer qu'il peut être converti en JSON
        try {
          const test = JSON.stringify(updateData.sources);
          // Si pas d'erreur, on est bon
        } catch (e) {
          updateData.sources = null;
        }
      }
    }
    
    // images (tableau → JSONB)
    if (updateData.images) {
      if (typeof updateData.images === 'string') {
        try {
          updateData.images = JSON.parse(updateData.images);
        } catch (e) {
          // Erreur silencieuse, on continue
        }
      } else if (Array.isArray(updateData.images)) {
        // C'est déjà un tableau, s'assurer qu'il peut être converti en JSON
        try {
          const test = JSON.stringify(updateData.images);
          // Si pas d'erreur, on est bon
        } catch (e) {
          updateData.images = null;
        }
      }
    }
    
    // keywords (tableau → TEXT[])
    if (updateData.keywords) {
      if (typeof updateData.keywords === 'string') {
        try {
          updateData.keywords = JSON.parse(updateData.keywords);
        } catch (e) {
          // Erreur silencieuse, on continue
        }
      } else if (Array.isArray(updateData.keywords)) {
        // Vérifier que tous les éléments sont des chaînes
        updateData.keywords = updateData.keywords
          .filter(keyword => typeof keyword === 'string')
          .map(keyword => keyword.trim());
      }
    }
    
    // Créer une copie pour éviter les mutations imprévues
    const finalUpdateData = { ...updateData };

    // Obtenir l'ID utilisateur depuis la session
    const userId = session.user.id;

    // Ajouter l'ID utilisateur aux données à mettre à jour pour respecter les politiques RLS
    const finalUpdateDataWithUser = { 
      ...finalUpdateData,
      user_id: userId
    };

    // Essayer de mettre à jour d'abord
    const { data: updatedData, error: updateError } = await updateSearchHistoryById(historyId, finalUpdateDataWithUser);

    // Si l'entrée n'existe pas, on la crée
    if (updateError?.code === 'PGRST116' || !updatedData) {
      const { data: insertedData, error: insertError } = await insertSearchHistory({ 
        ...finalUpdateDataWithUser, 
        id: historyId
      });

      if (insertError) {
        throw insertError;
      }

      if (!insertedData) {
        throw new Error('Aucune donnée retournée après la création');
      }

      return true;
    }

    if (updateError) {
      throw updateError;
    }

    // Vérification des champs mis à jour
    const updatedFields = Object.keys(finalUpdateData).filter(key => 
      key !== 'user_id' && key !== 'query'
    );
    
    const missingFields = updatedFields.filter(
      field => updatedData[field] === null || updatedData[field] === undefined
    );

    // La mise à jour est considérée comme réussie même si certains champs sont manquants
    return true;
  } catch (e) {
    setError(`Erreur lors de la sauvegarde: ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    return false;
  }
};

/**
 * Types de modèles Mistral AI disponibles
 */
export type MistralModel = 'mistral-tiny' | 'mistral-small' | 'mistral-medium';

/**
 * Interface des informations sur les modèles Mistral
 */
interface MistralModelInfo {
  name: string;
  maxTokens: number;
  description: string;
  isFree: boolean;
}

/**
 * Configuration des modèles Mistral disponibles avec leurs caractéristiques
 */
export const MISTRAL_MODELS: Record<MistralModel, MistralModelInfo> = {
  'mistral-tiny': {
    name: 'mistral-tiny',
    maxTokens: 4096,
    description: 'Modèle léger pour les tâches simples',
    isFree: true
  },
  'mistral-small': {
    name: 'mistral-small',
    maxTokens: 4096,
    description: 'Modèle équilibré pour la plupart des tâches',
    isFree: true
  },
  'mistral-medium': {
    name: 'mistral-medium',
    maxTokens: 4096,
    description: 'Modèle performant pour les tâches complexes',
    isFree: false
  }
}; 