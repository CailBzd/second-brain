import { getSupabaseClient, insertSearchHistory, updateSearchHistoryById } from '@/lib/supabase';

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

export const CATEGORIES = {
  INTRO: 'introduction',
  CONTEXT: 'context',
  EXPOSITION: 'exposition',
  CONCLUSION: 'conclusion'
} as const;

export type Category = typeof CATEGORIES[keyof typeof CATEGORIES];

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

// Fonction pour convertir en snake_case
export const convertToSnakeCase = (str: string) => 
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Fonction pour nettoyer et formater les résultats
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

// Fonction pour récupérer un champ spécifique
export const fetchField = async (
  query: string, 
  field: string,
  abortController: AbortController,
  setSearchResult: (value: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void,
  setLoadedFields: (value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void
) => {
  try {
    console.log(`Récupération du champ ${field}...`);
    
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
    
    console.log(`Champ ${field} récupéré avec succès:`, data[field]);
    
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

// Fonction pour sauvegarder l'historique
export const saveSearchHistory = async (
  historyId: string,
  dataToSave: Record<string, any>,
  setError: (error: string | null) => void
) => {
  console.log('=== Début saveSearchHistory ===');
  console.log('ID historique:', historyId);
  console.log('Données à sauvegarder:', dataToSave);

  const supabase = getSupabaseClient();
  
  try {
    // Vérifier la session utilisateur
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session non trouvée:', sessionError);
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
          console.warn('Erreur lors du parsing de exposition:', e);
        }
      } else if (typeof updateData.exposition === 'object') {
        // Déjà un objet, s'assurer qu'il peut être converti en JSON
        try {
          const test = JSON.stringify(updateData.exposition);
          // Si pas d'erreur, on est bon
        } catch (e) {
          console.warn('Erreur lors de la conversion de exposition en JSON:', e);
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
          console.warn('Erreur lors du parsing de sources:', e);
        }
      } else if (Array.isArray(updateData.sources)) {
        // C'est déjà un tableau, s'assurer qu'il peut être converti en JSON
        try {
          const test = JSON.stringify(updateData.sources);
          // Si pas d'erreur, on est bon
        } catch (e) {
          console.warn('Erreur lors de la conversion de sources en JSON:', e);
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
          console.warn('Erreur lors du parsing de images:', e);
        }
      } else if (Array.isArray(updateData.images)) {
        // C'est déjà un tableau, s'assurer qu'il peut être converti en JSON
        try {
          const test = JSON.stringify(updateData.images);
          // Si pas d'erreur, on est bon
        } catch (e) {
          console.warn('Erreur lors de la conversion de images en JSON:', e);
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
          console.warn('Erreur lors du parsing de keywords:', e);
        }
      } else if (Array.isArray(updateData.keywords)) {
        // Vérifier que tous les éléments sont des chaînes
        updateData.keywords = updateData.keywords
          .filter(keyword => typeof keyword === 'string')
          .map(keyword => keyword.trim());
      }
    }
    
    console.log('Type de updateData:', typeof updateData);
    console.log('Données préparées pour la mise à jour:', JSON.stringify(updateData, null, 2));
    
    // Créer une copie pour éviter les mutations imprévues
    const finalUpdateData = { ...updateData };

    // Log des types
    Object.entries(finalUpdateData).forEach(([key, value]) => {
      console.log(`Champ ${key}: Type = ${typeof value}, Valeur =`, value);
    });

    // Essayer de mettre à jour d'abord
    const { data: updatedData, error: updateError } = await updateSearchHistoryById(historyId, finalUpdateData);

    // Si l'entrée n'existe pas, on la crée
    if (updateError?.code === 'PGRST116' || !updatedData) {
      console.log('Entrée non trouvée, création d\'une nouvelle entrée...');
      const { data: insertedData, error: insertError } = await insertSearchHistory({ ...finalUpdateData, id: historyId });

      if (insertError) {
        console.error('Erreur lors de la création:', insertError);
        throw insertError;
      }

      if (!insertedData) {
        throw new Error('Aucune donnée retournée après la création');
      }

      console.log('Nouvelle entrée créée avec succès:', insertedData);
      return true;
    }

    if (updateError) {
      console.error('Erreur lors de la mise à jour:', updateError);
      throw updateError;
    }

    console.log('Mise à jour réussie:', updatedData);

    // Vérification des champs mis à jour
    const updatedFields = Object.keys(finalUpdateData).filter(key => 
      key !== 'user_id' && key !== 'query'
    );

    console.log('Champs mis à jour:', updatedFields);
    
    const missingFields = updatedFields.filter(
      field => updatedData[field] === null || updatedData[field] === undefined
    );

    if (missingFields.length > 0) {
      console.warn('⚠️ Champs manquants après mise à jour:', missingFields);
      console.warn('Comparaison des données:');
      missingFields.forEach(field => {
        console.warn(`- ${field}:`);
        console.warn('  Attendu:', finalUpdateData[field]);
        console.warn('  Sauvegardé:', updatedData[field]);
      });
    } else {
      console.log('✅ Tous les champs ont été correctement sauvegardés');
    }

    console.log('=== Fin saveSearchHistory ===');
    return true;
  } catch (e) {
    console.error('❌ Exception lors de la mise à jour:', e);
    console.error('Stack trace:', e instanceof Error ? e.stack : 'Non disponible');
    setError(`Erreur lors de la sauvegarde: ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    return false;
  }
};

export type MistralModel = 'mistral-tiny' | 'mistral-small' | 'mistral-medium';

interface MistralModelInfo {
  name: string;
  maxTokens: number;
  description: string;
  isFree: boolean;
}

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