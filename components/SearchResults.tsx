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

  // Fonction pour traiter le texte des repères historiques
  const parseHistoricalContext = (text: string) => {
    if (!text) return [];
    
    // Chercher spécifiquement les patterns "1. ", "2. " et "3. "
    const points = [];
    const patterns = [/1\.\s+/, /2\.\s+/, /3\.\s+/];
    
    // Trouver les positions de chaque marqueur
    const positions = patterns.map(pattern => {
      const match = text.match(pattern);
      return match ? match.index : -1;
    }).filter(pos => pos !== -1) as number[];
    
    // Si on trouve au moins un marqueur
    if (positions.length > 0) {
      positions.sort((a, b) => a - b);
      
      // Extraire chaque section
      for (let i = 0; i < positions.length; i++) {
        const start = positions[i];
        const end = i < positions.length - 1 ? positions[i + 1] : text.length;
        const section = text.substring(start, end).trim();
        points.push(section);
      }
      
      // S'il manque des points, chercher le contenu avant le premier marqueur trouvé
      if (points.length < 3 && positions[0] > 0) {
        const beforeText = text.substring(0, positions[0]).trim();
        if (beforeText && !beforeText.match(/^\d+\.\s+/)) {
          points.unshift("1. " + beforeText);
        }
      }
      
      return points;
    }
    
    // Si on ne trouve pas les marqueurs spécifiques, essayer une recherche plus générale
    const generalPattern = /\b(\d+)\.\s+/g;
    let match;
    const matches: Array<{index: number, number: string}> = [];
    while ((match = generalPattern.exec(text)) !== null) {
      matches.push({ index: match.index, number: match[1] });
    }
    
    if (matches.length > 0) {
      matches.sort((a, b) => a.index - b.index);
      
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index;
        const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
        const section = text.substring(start, end).trim();
        points.push(section);
      }
      
      return points;
    }
    
    // Dernier recours : diviser le texte en 3 sections
    if (text.length > 30) {
      // Essayer de trouver des phrases complètes
      const sentences = text.split(/(?<=\.)\s+/);
      
      if (sentences.length >= 3) {
        // Regrouper les phrases en 3 groupes approximativement égaux
        const third = Math.ceil(sentences.length / 3);
        return [
          "1. " + sentences.slice(0, third).join(' '),
          "2. " + sentences.slice(third, third * 2).join(' '),
          "3. " + sentences.slice(third * 2).join(' ')
        ];
      } else {
        // Si pas assez de phrases, diviser par caractères
        const thirdLength = Math.floor(text.length / 3);
        return [
          "1. " + text.slice(0, thirdLength).trim(),
          "2. " + text.slice(thirdLength, thirdLength * 2).trim(),
          "3. " + text.slice(thirdLength * 2).trim()
        ];
      }
    }
    
    // Si tout échoue, retourner le texte entier comme un seul point
    return ["1. " + text];
  };

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

      {/* Repères Historiques */}
      {result.historicalContext ? (
        <section className="bg-purple-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-purple-800">Repères Historiques</h2>
          
          <div className="space-y-3">
            {parseHistoricalContext(result.historicalContext).map((point, index) => {
              // Détecter le numéro en début de chaîne
              const numberMatch = point.match(/^(\d+)\./);
              const pointNumber = numberMatch ? numberMatch[1] : String(index + 1);
              
              // Nettoyer le texte (enlever astérisques et le numéro initial)
              const cleanPoint = point.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '');
              
              // Couleurs pour chaque point
              const colors = [
                "bg-purple-100 border-purple-300",
                "bg-indigo-100 border-indigo-300",
                "bg-pink-100 border-pink-300"
              ];
              
              // Essayer de diviser en "période : contenu" ou similaire
              let title = '';
              let content = cleanPoint;
              
              const separators = [' : ', ': ', ' - ', ' – '];
              for (const separator of separators) {
                if (cleanPoint.includes(separator)) {
                  const [titlePart, ...contentParts] = cleanPoint.split(separator);
                  
                  // Vérifier si la première partie ressemble à une période (contient des chiffres)
                  if (/\d/.test(titlePart)) {
                    title = titlePart.trim();
                    content = contentParts.join(separator).trim();
                    break;
                  }
                }
              }
              
              // Si pas de titre trouvé et si le contenu est long, utiliser la première phrase comme titre
              if (!title && content.length > 50) {
                const sentenceEnd = content.indexOf('. ');
                if (sentenceEnd > 10 && sentenceEnd < 100) {
                  title = content.substring(0, sentenceEnd + 1).trim();
                  content = content.substring(sentenceEnd + 1).trim();
                }
              }
              
              return (
                <div 
                  key={index} 
                  className={`${colors[index % 3]} border-l-4 p-4 rounded-md shadow-sm animate-fadeIn hover:shadow-md transition-all`}
                  style={{animationDelay: `${index * 0.15}s`}}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-8 w-8 rounded-full bg-white shadow-inner flex items-center justify-center text-purple-800 font-bold">
                        {pointNumber}
                      </div>
                    </div>
                    <div className="flex-1">
                      {title ? (
                        <>
                          <div className="font-bold text-purple-900 mb-1">{title}</div>
                          <div className="text-gray-800">{content}</div>
                        </>
                      ) : (
                        <div className="text-gray-800">{content}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : isLoading && (
        <LoadingSection title="Repères Historiques" />
      )}

      {/* Anecdote */}
      {result.anecdote ? (
        <section className="bg-indigo-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-indigo-800">Anecdote</h2>
          <p className="text-gray-700 leading-relaxed italic">{result.anecdote}</p>
        </section>
      ) : isLoading && (
        <LoadingSection title="Anecdote" />
      )}

      {/* Exposé Détaillé */}
      {(result.exposition?.introduction || result.exposition?.paragraphs?.length || result.exposition?.conclusion) ? (
        <section className="bg-gray-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Exposé Détaillé</h2>
          <div className="space-y-6">
            {/* Introduction */}
            {result.exposition?.introduction ? (
              <div className="bg-white p-4 rounded-lg shadow-sm animate-fadeIn">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Introduction</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {result.exposition.introduction}
                </p>
              </div>
            ) : isLoading && (
              <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
                <h3 className="text-xl font-semibold mb-3 text-gray-400">Introduction</h3>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            )}

            {/* Paragraphes */}
            {result.exposition?.paragraphs?.map((paragraph, index) => (
              <div key={index} className={`p-4 rounded-lg shadow-sm ${paragraphColors[index]} animate-fadeIn`}
                   style={{animationDelay: `${index * 0.2}s`}}>
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

            {/* Ajouter des placeholders pour les paragraphes manquants en mode chargement */}
            {isLoading && result.exposition?.paragraphs && result.exposition?.paragraphs.length < 3 && 
              Array.from({ length: 3 - (result.exposition?.paragraphs?.length || 0) }).map((_, index) => {
                const actualIndex = (result.exposition?.paragraphs?.length || 0) + index;
                return (
                  <div key={`loading-paragraph-${actualIndex}`} className={`p-4 rounded-lg shadow-sm animate-pulse`}>
                    <h3 className="text-xl font-semibold mb-3 text-gray-400">{paragraphTitles[actualIndex]}</h3>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </div>
                );
              })
            }

            {/* Conclusion */}
            {result.exposition?.conclusion ? (
              <div className="bg-white p-4 rounded-lg shadow-sm animate-fadeIn">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Conclusion</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {result.exposition.conclusion}
                </p>
              </div>
            ) : isLoading && (
              <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
                <h3 className="text-xl font-semibold mb-3 text-gray-400">Conclusion</h3>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : isLoading && (
        <LoadingSection title="Exposé Détaillé" />
      )}

      {/* Sources et Références */}
      {result.sources && result.sources.length > 0 ? (
        <section className="bg-gray-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Sources et Références</h2>
          <ul className="grid grid-cols-1 gap-4">
            {result.sources.map((source, index) => (
              <li key={index} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow animate-fadeIn"
                  style={{animationDelay: `${index * 0.15}s`}}>
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
      ) : isLoading && (
        <LoadingSection title="Sources et Références" />
      )}

      {/* Images et Illustrations */}
      {result.images && result.images.length > 0 ? (
        <section className="bg-gray-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Images et Illustrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.images.map((image, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow animate-fadeIn"
                   style={{animationDelay: `${index * 0.15}s`}}>
                {image.url ? (
                  <div className="relative">
                    <img 
                      src={image.url} 
                      alt={image.description || 'Image illustrative'} 
                      className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== window.location.origin + '/image-non-disponible.svg' && !target.src.endsWith('/image-non-disponible.svg')) {
                          target.src = '/image-non-disponible.svg';
                          target.onerror = null; // Empêche la boucle infinie
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-end transition-all duration-300">
                      <p className="text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                        {image.description}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                    Image non disponible
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : isLoading && (
        <LoadingSection title="Images et Illustrations" />
      )}

      {/* Mots-clés */}
      {result.keywords && result.keywords.length > 0 ? (
        <section className="bg-gray-50 p-4 rounded-lg animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Mots-clés</h2>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((keyword, index) => (
              <span 
                key={index} 
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm animate-fadeIn"
                style={{animationDelay: `${index * 0.1}s`}}
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