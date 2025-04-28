import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown } from "lucide-react"
import { useState } from "react"

interface SearchFormProps {
  onSearch: (query: string, model: string) => Promise<void>;
  isLoading: boolean;
  minimized?: boolean;
}

const MISTRAL_MODELS = [
  { id: 'mistral-tiny', name: 'Mistral Tiny (Gratuit)', description: 'Modèle léger pour des tâches simples' },
  { id: 'mistral-small', name: 'Mistral Small (Gratuit)', description: 'Modèle équilibré pour la plupart des tâches' },
  { id: 'mistral-medium', name: 'Mistral Medium (Payant)', description: 'Modèle performant pour des tâches complexes' },
  { id: 'mistral-large', name: 'Mistral Large (Payant)', description: 'Modèle le plus puissant pour des tâches exigeantes' }
];

export function SearchForm({ onSearch, isLoading, minimized = false }: SearchFormProps) {
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState(MISTRAL_MODELS[0].id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.length < 20) {
      setError("Veuillez fournir au moins 20 caractères pour une recherche pertinente")
      return
    }
    setError(null)
    await onSearch(query, selectedModel)
  }

  return (
    <div className="space-y-4">
      {!minimized && (
        <p className="text-gray-600 text-center max-w-2xl mx-auto">
          Pour une recherche organisée et pertinente, veuillez fournir un contexte détaillé 
          (minimum 20 caractères). Plus votre question sera précise, plus les résultats seront pertinents.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex w-full max-w-2xl mx-auto items-center">
        <Input
          type="search"
          placeholder={minimized ? "Nouvelle recherche..." : "Ex: Je cherche à comprendre l'impact de la révolution industrielle sur l'organisation du travail au 19ème siècle..."}
          className="rounded-r-none h-11 border-r-0 focus:z-10"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setError(null)
          }}
          disabled={isLoading}
        />
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="h-11 text-sm bg-gray-50 border border-gray-200 border-l-0 rounded-none focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 px-3 py-1 transition-colors min-w-[170px]"
          disabled={isLoading}
        >
          {MISTRAL_MODELS.map((model) => (
            <option key={model.id} value={model.id} title={model.description}>
              {model.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="icon" disabled={isLoading} className="rounded-l-none h-11">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  )
} 