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
