import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

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
    introduction: string;
    paragraphs: string[];
    conclusion: string;
  };
  sources?: Source[];
  images?: Image[];
  keywords?: string[];
}

const CATEGORIES = {
  INTRO: 'introduction',
  CONTEXT: 'context',
  EXPOSITION: 'exposition',
  CONCLUSION: 'conclusion'
} as const;

type Category = typeof CATEGORIES[keyof typeof CATEGORIES];

interface SearchResultsProps {
  result: SearchResult;
  isLoading: boolean;
  currentCategory: Category;
}

const isUrl = (str: string) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

export default function SearchResults({ result, isLoading, currentCategory }: SearchResultsProps) {
  if (!result && !isLoading) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Introduction Section */}
      {(currentCategory === CATEGORIES.INTRO || result.title || result.summary) && (
        <div className="mb-8">
          {result.title && (
            <h1 className="text-3xl font-bold mb-4 text-gray-900">{result.title}</h1>
          )}
          {result.summary && (
            <div className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
              {result.summary}
            </div>
          )}
        </div>
      )}

      {/* Context Section */}
      {(currentCategory === CATEGORIES.CONTEXT || result.historicalContext || result.anecdote) && (
        <div className="mb-8">
          {result.historicalContext && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Repères Historiques</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {result.historicalContext}
              </div>
            </div>
          )}
          {result.anecdote && (
            <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Anecdote</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                {result.anecdote}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exposition Section */}
      {(currentCategory === CATEGORIES.EXPOSITION || result.exposition?.introduction || result.exposition?.paragraphs?.length) && (
        <div className="mb-8">
          {result.exposition?.introduction && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Introduction</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {result.exposition.introduction}
              </div>
            </div>
          )}
          {result.exposition?.paragraphs?.filter(p => p.length > 0).map((paragraph, index) => (
            <div key={index} className="mb-6 bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                {index === 0 && "Approche Philosophique"}
                {index === 1 && "Analyse Critique"}
                {index === 2 && "Perspective Contemporaine"}
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {paragraph}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Images Section */}
      {result.images && result.images.length > 0 && result.images.some(img => img.url) && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {result.images
              .filter(image => image.url && image.url.startsWith('http'))
              .map((image, index) => (
                <div key={index} className="relative bg-white p-4 rounded-lg border border-gray-200">
                  <img
                    src={image.url}
                    alt={image.description}
                    className="w-full h-48 object-cover rounded-lg mb-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                    }}
                  />
                  <p className="text-sm text-gray-600">{image.description}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Conclusion Section */}
      {(currentCategory === CATEGORIES.CONCLUSION || result.exposition?.conclusion || result.sources?.length || result.images?.length || result.keywords?.length) && (
        <>
          {result.exposition?.conclusion && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Conclusion</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {result.exposition.conclusion}
              </div>
            </div>
          )}

          {result.sources && result.sources.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Sources</h2>
              <ul className="list-disc list-inside space-y-2">
                {result.sources.map((source, index) => (
                  <li key={index} className="text-gray-700">
                    {isUrl(source.url) ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                      >
                        {source.title}
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                      </a>
                    ) : (
                      source.title
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.keywords && result.keywords.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Mots-clés</h2>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 