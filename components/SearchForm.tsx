import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface SearchFormProps {
  onSubmit: (query: string) => Promise<void>;
}

export function SearchForm({ onSubmit }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 1000);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Veuillez entrer une question');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    setProgress(0);
    
    try {
      await onSubmit(query);
      setProgress(100);
    } catch (err) {
      setError('Une erreur est survenue lors de la recherche');
      console.error('Error:', err);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Entrez votre question de recherche..."
        className="min-h-[100px]"
      />
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Recherche en cours...' : 'Rechercher'}
      </Button>
      {isLoading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-500 text-center">
            Recherche en cours... ({progress}%)
          </p>
        </div>
      )}
    </form>
  );
} 