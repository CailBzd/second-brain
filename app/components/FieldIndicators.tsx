interface FieldIndicatorsProps {
  loadedFields: Record<string, boolean>;
  isLoading: boolean;
}

export const FieldIndicators = ({ loadedFields, isLoading }: FieldIndicatorsProps) => (
  <div className="flex flex-wrap gap-2 mt-4">
    {[
      { key: 'title', label: 'Titre', icon: '📝' },
      { key: 'summary', label: 'Résumé', icon: '📋' },
      { key: 'historical_context', label: 'Contexte', icon: '🏛️' },
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
            : isLoading
              ? 'bg-gray-100 text-gray-500 border border-gray-200'
              : 'bg-red-100 text-red-800 border border-red-300'
          }
          transition-all duration-300
        `}
        title={loadedFields[field.key] 
          ? "Contenu généré avec succès" 
          : isLoading
            ? "Génération en cours..."
            : "Échec de la génération"
        }
      >
        <span>{field.icon}</span>
        <span>{field.label}</span>
        {loadedFields[field.key] && (
          <span className="text-green-600">✓</span>
        )}
        {!loadedFields[field.key] && !isLoading && (
          <span className="text-red-600">×</span>
        )}
      </span>
    ))}
  </div>
); 