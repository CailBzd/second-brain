# Second Brain - Assistant de Recherche Intelligent

Second Brain est une application web développée avec Next.js qui utilise l'API Mistral AI pour organiser et structurer vos recherches de manière intelligente. L'application génère des exposés complets avec une approche philosophique, incluant des sources pertinentes, des images et des mots-clés.

## Fonctionnalités

- **Recherche intelligente** : Posez une question et obtenez une réponse structurée
- **Structure argumentative** : Exposé avec introduction, trois paragraphes philosophiques et conclusion
- **Contenu enrichi** :
  - Titre accrocheur
  - Résumé concis
  - Repères historiques
  - Anecdote pertinente
  - Sources avec liens cliquables
  - Images illustratives
  - Mots-clés

## Structure de l'exposé

1. **Titre** - Accrocheur et pertinent
2. **Résumé** - Synthèse en 2-3 lignes
3. **Repères Historiques** - Contexte en 3-4 lignes
4. **Anecdote** - Élément intéressant en 2-3 lignes
5. **Exposé** :
   - Introduction
   - Approche philosophique (10 lignes)
   - Analyse critique (10 lignes)
   - Perspective contemporaine (10 lignes)
   - Conclusion
6. **Sources** - 3 sources pertinentes avec liens
7. **Images** - 3 images illustratives
8. **Mots-clés** - 3 tags pertinents

## Technologies utilisées

- **Next.js** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **Mistral AI** - Intelligence artificielle
- **Radix UI** - Composants d'interface
- **Supabase** - Base de données et authentification

## Structure du Code

L'application est organisée selon l'architecture suivante:

### Couche de Base de Données (lib/)
- **lib/supabase.ts** - Client Supabase et fonctions d'accès à la base de données
  - Contient les fonctions CRUD pour les tables `search_history` et `daily_requests`
  - Utilise la méthode `upsert` pour éviter les erreurs de clés dupliquées

### Utilitaires (app/utils/)
- **app/utils/searchUtils.ts** - Fonctions utilitaires pour la recherche
  - Définit les interfaces et types communs
  - Contient les fonctions de formatage et de traitement des données
  - Gère la sauvegarde des résultats de recherche

### API (app/api/)
- **app/api/search/route.ts** - API REST pour la recherche
  - Communique avec Mistral AI pour générer des résultats
  - Traite les résultats bruts et les structure
  - Sauvegarde les résultats dans Supabase

- **app/api/history/route.ts** - API REST pour l'historique
  - Récupère, supprime et gère les entrées d'historique

### Composants d'Interface (app/components/, components/)
- Composants réutilisables pour l'interface utilisateur
- Formulaires, cartes, boutons et autres éléments d'UI

### Pages (app/)
- **app/page.tsx** - Page d'accueil/recherche
  - Formulaire de recherche
  - Affichage des résultats
  - Gestion des quotas d'utilisation

- **app/history/page.tsx** - Page d'historique
  - Affichage et gestion des recherches précédentes

### Flux de Données

1. L'utilisateur soumet une requête via le formulaire de recherche
2. Le serveur vérifie les quotas et limites d'utilisation
3. Pour chaque champ requis (titre, résumé, etc.):
   - L'API envoie un prompt spécifique à Mistral AI
   - Les résultats sont analysés et structurés
   - Les données sont sauvegardées dans Supabase
4. Les résultats sont affichés à l'utilisateur
5. L'historique est mis à jour pour référence future

### Sécurité

- Authentification gérée par Supabase
- Row-Level Security (RLS) pour limiter l'accès aux données
- Chaque utilisateur ne peut voir et modifier que ses propres recherches

## Installation

1. Clonez le repository :
```bash
git clone https://github.com/CailBzd/second-brain.git
cd second-brain
```

2. Installez les dépendances :
```bash
npm install
```

3. Créez un fichier `.env.local` à la racine du projet et ajoutez votre clé API Mistral :
```
MISTRAL_API_KEY=votre_clé_api
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_supabase_anon
```

4. Lancez le serveur de développement :
```bash
npm run dev
```

5. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Utilisation

1. Entrez votre question dans le champ de recherche
2. Cliquez sur "Rechercher"
3. Attendez la génération de l'exposé
4. Explorez les différentes sections du résultat

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir une issue pour signaler un bug
- Proposer une amélioration
- Soumettre une pull request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Auteur

- [CailBzd](https://github.com/CailBzd)

## Remerciements

- Mistral AI pour leur API
- La communauté Next.js
- Tous les contributeurs
