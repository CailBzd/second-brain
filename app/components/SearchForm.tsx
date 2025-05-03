interface SearchFormProps {
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
  minimized?: boolean;
}

export const SearchForm = ({ onSearch, isLoading, minimized = false }: SearchFormProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('query') as string;
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          name="query"
          placeholder="Posez votre question..."
          className={`
            flex-1 px-4 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${minimized ? 'text-sm' : 'text-base'}
            transition-all duration-300
          `}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`
            px-6 py-2 bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${minimized ? 'text-sm' : 'text-base'}
            transition-all duration-300
          `}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Recherche...</span>
            </div>
          ) : (
            'Rechercher'
          )}
        </button>
      </div>
    </form>
  );
}; 