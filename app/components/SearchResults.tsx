import { SearchResult, Category } from '../utils/searchUtils';

interface SearchResultsProps {
  result: SearchResult | null;
  isLoading: boolean;
  currentCategory: Category;
}

export function SearchResults({ result, isLoading, currentCategory }: SearchResultsProps) {
  if (!result && isLoading) {
    return (
      <div className="space-y-8 bg-white p-6 rounded-lg shadow-lg">
        <div className="animate-pulse space-y-6">
          {/* En-tête */}
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>

          {/* Indicateur de chargement */}
          <div className="flex items-center justify-center space-x-3 py-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          </div>

          <div className="text-center">
            <div className="text-blue-600 font-medium mb-2">
              Génération en cours...
            </div>
            <div className="text-gray-500 text-sm">
              Les résultats s'afficheront progressivement
            </div>
          </div>

          {/* Sections simulées */}
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Component pour afficher une section en chargement
  const LoadingSection = ({ title }: { title: string }) => (
    <section className="bg-gray-50 p-4 rounded-lg animate-pulse">
      <h2 className="text-2xl font-bold mb-4 text-gray-400">{title}</h2>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </section>
  );

  // Si aucun résultat et pas de chargement, ne rien afficher
  if (!result) return null;

  return (
    <div className="space-y-8 bg-white p-6 rounded-lg shadow-lg transition-all duration-500">
      {/* Titre */}
      {result.title ? (
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 animate-fadeIn">
          {result.title}
        </h1>
      ) : isLoading && (
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      )}

      {/* Résumé */}
      {result.summary ? (
        <section className="bg-blue-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Résumé</h2>
          <p className="text-gray-700 leading-relaxed">{result.summary}</p>
        </section>
      ) : isLoading && (
        <LoadingSection title="Résumé" />
      )}

      {/* Contexte Historique */}
      {result.historical_context ? (
        <section className="bg-purple-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-purple-800">Contexte Historique</h2>
          <p className="text-gray-700 leading-relaxed">{result.historical_context}</p>
        </section>
      ) : isLoading && (
        <LoadingSection title="Contexte Historique" />
      )}

      {/* Anecdote */}
      {result.anecdote ? (
        <section className="bg-yellow-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-yellow-800">Anecdote</h2>
          <p className="text-gray-700 leading-relaxed italic">{result.anecdote}</p>
        </section>
      ) : isLoading && (
        <LoadingSection title="Anecdote" />
      )}

      {/* Exposé */}
      {result.exposition ? (
        <section className="bg-green-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-green-800">Exposé</h2>
          
          {result.exposition.introduction && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-green-700">Introduction</h3>
              <p className="text-gray-700 leading-relaxed">{result.exposition.introduction}</p>
            </div>
          )}
          
          {result.exposition.paragraphs && result.exposition.paragraphs.map((paragraph, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-green-700">
                {index === 0 ? "Approche Philosophique" :
                 index === 1 ? "Analyse Critique" :
                 "Perspective Contemporaine"}
              </h3>
              <p className="text-gray-700 leading-relaxed">{paragraph}</p>
            </div>
          ))}
          
          {result.exposition.conclusion && (
            <div>
              <h3 className="text-xl font-semibold mb-2 text-green-700">Conclusion</h3>
              <p className="text-gray-700 leading-relaxed">{result.exposition.conclusion}</p>
            </div>
          )}
        </section>
      ) : isLoading && (
        <LoadingSection title="Exposé" />
      )}

      {/* Sources */}
      {result.sources && result.sources.length > 0 ? (
        <section className="bg-indigo-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-indigo-800">Sources</h2>
          <div className="grid gap-4">
            {result.sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-indigo-600 hover:text-indigo-800">{source.title}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </section>
      ) : isLoading && (
        <LoadingSection title="Sources" />
      )}

      {/* Images */}
      {result.images && result.images.length > 0 ? (
        <section className="bg-pink-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-pink-800">Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.images.map((image, index) => (
              <div key={index} className="relative group overflow-hidden rounded-lg">
                <img
                  src={image.url}
                  alt={image.description}
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/image-non-disponible.svg';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {image.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : isLoading && (
        <LoadingSection title="Images" />
      )}

      {/* Mots-clés */}
      {result.keywords && result.keywords.length > 0 ? (
        <section className="bg-gray-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Mots-clés</h2>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white text-gray-800 rounded-full shadow-sm text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </section>
      ) : isLoading && (
        <LoadingSection title="Mots-clés" />
      )}
    </div>
  );
} 