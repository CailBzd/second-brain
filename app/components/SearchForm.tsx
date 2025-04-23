import React, { useState } from 'react';

interface SearchFormProps {
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col space-y-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Posez votre question..."
            className="flex-1 px-4 py-2 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
          
          <button
            type="submit"
            className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Génération...' : 'Générer'}
          </button>
        </div>
      </div>
    </form>
  );
} 