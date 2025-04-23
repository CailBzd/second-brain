interface SearchResult {
  title: string;
  summary: string;
  historicalContext: string;
  anecdote: string;
  exposition: {
    introduction: string;
    paragraphs: string[];
    conclusion: string;
  };
  sources: string[];
  images: { url: string; description: string }[];
  keywords: string[];
}

interface SearchResultsProps {
  result: SearchResult | null;
}

export function SearchResults({ result }: SearchResultsProps) {
  console.log('Résultats reçus dans SearchResults:', result);

  if (!result) return null;

  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-8 bg-white p-6 rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        {result.title}
      </h1>

      <section className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">Résumé</h2>
        <p className="text-gray-700 leading-relaxed">{result.summary}</p>
      </section>

      <section className="bg-purple-50 p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-purple-800">Repères Historiques</h2>
        <p className="text-gray-700 leading-relaxed">{result.historicalContext}</p>
      </section>

      <section className="bg-indigo-50 p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-indigo-800">Anecdote</h2>
        <p className="text-gray-700 leading-relaxed italic">{result.anecdote}</p>
      </section>

      <section className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Exposé</h2>
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Introduction</h3>
            <p className="text-gray-700 leading-relaxed">{result.exposition.introduction}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-green-700">Approche Philosophique</h3>
            <p className="text-gray-700 leading-relaxed">{result.exposition.paragraphs[0]}</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-red-700">Analyse Critique</h3>
            <p className="text-gray-700 leading-relaxed">{result.exposition.paragraphs[1]}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-yellow-700">Perspective Contemporaine</h3>
            <p className="text-gray-700 leading-relaxed">{result.exposition.paragraphs[2]}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Conclusion</h3>
            <p className="text-gray-700 leading-relaxed">{result.exposition.conclusion}</p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Images</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.images.map((image, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
              <img 
                src={image.url} 
                alt={image.description}
                className="w-full h-48 object-cover rounded-lg mb-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/300x200?text=Image+non+disponible';
                }}
              />
              <p className="text-sm text-gray-600 text-center">{image.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Sources</h2>
        <ul className="list-disc pl-6 space-y-2">
          {result.sources.map((source, index) => (
            <li key={index} className="text-gray-600 hover:bg-gray-100 p-2 rounded transition-colors">
              {isUrl(source) ? (
                <a 
                  href={source} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {source}
                </a>
              ) : (
                source
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Mots-clés</h2>
        <div className="flex flex-wrap gap-2">
          {result.keywords.map((keyword, index) => (
            <span 
              key={index}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              {keyword}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
} 