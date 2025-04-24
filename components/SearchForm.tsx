import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState } from "react"

interface SearchFormProps {
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.length < 30) {
      setError("Veuillez fournir au moins 30 caractères pour une recherche pertinente")
      return
    }
    setError(null)
    await onSearch(query)
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-center max-w-2xl mx-auto">
        Pour une recherche organisée et pertinente, veuillez fournir un contexte détaillé 
        (minimum 30 caractères). Plus votre question sera précise, plus les résultats seront pertinents.
      </p>

      <form onSubmit={handleSubmit} className="flex w-full max-w-2xl mx-auto items-center space-x-2">
        <Input
          type="search"
          placeholder="Ex: Je cherche à comprendre l'impact de la révolution industrielle sur l'organisation du travail au 19ème siècle..."
          className="flex-1"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setError(null)
          }}
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  )
} 