interface Source {
  url: string;
  title: string;
}

interface Image {
  url: string;
  description: string;
}

interface SearchResult {
  title?: string;
  summary?: string;
  historicalContext?: string;
  anecdote?: string;
  exposition?: {
    introduction?: string;
    paragraphs?: string[];
    conclusion?: string;
  };
  sources?: Source[];
  images?: Image[];
  keywords?: string[];
}

interface SearchResultsProps {
  result: SearchResult | null;
  isLoading: boolean;
  currentCategory: string;
}

export function SearchResults({ result, isLoading, currentCategory }: SearchResultsProps) {
  if (isLoading) {
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
              Catégorie actuelle : {currentCategory}
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

  if (!result) return null;

  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  const paragraphTitles = [
    'Approche Philosophique',
    'Analyse Critique',
    'Perspective Contemporaine'
  ];

  const paragraphColors = [
    'bg-green-50 text-green-700',
    'bg-red-50 text-red-700',
    'bg-yellow-50 text-yellow-700'
  ];

  return (
    <div className="space-y-8 bg-white p-6 rounded-lg shadow-lg">
      {result.title && (
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          {result.title}
        </h1>
      )}

      {result.summary && (
        <section className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Résumé</h2>
          <p className="text-gray-700 leading-relaxed">{result.summary}</p>
        </section>
      )}

      {result.historicalContext && (
        <section className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-purple-800">Repères Historiques</h2>
          <p className="text-gray-700 leading-relaxed">{result.historicalContext}</p>
        </section>
      )}

      {result.anecdote && (
        <section className="bg-indigo-50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-indigo-800">Anecdote</h2>
          <p className="text-gray-700 leading-relaxed italic">{result.anecdote}</p>
        </section>
      )}

      {result.exposition && (
        <section className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Exposé Détaillé</h2>
          <div className="space-y-6">
            {result.exposition.introduction && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Introduction</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {result.exposition.introduction}
                </p>
              </div>
            )}

            {result.exposition.paragraphs?.map((paragraph, index) => (
              <div key={index} className={`p-4 rounded-lg shadow-sm ${paragraphColors[index]}`}>
                <h3 className="text-xl font-semibold mb-3">{paragraphTitles[index]}</h3>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{paragraph}</p>
                  {index === 0 && (
                    <div className="mt-2 text-sm text-green-600">
                      Analyse des concepts fondamentaux et des implications philosophiques
                    </div>
                  )}
                  {index === 1 && (
                    <div className="mt-2 text-sm text-red-600">
                      Évaluation des arguments et contre-arguments principaux
                    </div>
                  )}
                  {index === 2 && (
                    <div className="mt-2 text-sm text-yellow-600">
                      Applications et implications dans le contexte actuel
                    </div>
                  )}
                </div>
              </div>
            ))}

            {result.exposition.conclusion && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Conclusion</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {result.exposition.conclusion}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {result.sources && result.sources.length > 0 && (
        <section className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Sources et Références</h2>
          <ul className="grid grid-cols-1 gap-4">
            {result.sources.map((source, index) => (
              <li key={index} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {source.url ? (
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>{source.title || source.url}</span>
                  </a>
                ) : (
                  <span className="text-gray-500">Source non disponible</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.images && result.images.length > 0 && (
        <section className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Images et Illustrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.images.map((image, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="relative aspect-video mb-3">
                  {image.url ? (
                    <img 
                      src={image.url} 
                      alt={image.description}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Image non disponible</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 text-center">
                  {image.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {result.keywords && result.keywords.length > 0 && (
        <section className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Mots-clés et Concepts Clés</h2>
          <div className="flex flex-wrap gap-3">
            {result.keywords.map((keyword, index) => (
              <span 
                key={index}
                className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                {keyword}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
} 