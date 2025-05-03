import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aide - Second Brain',
  description: 'Tutoriel complet pour l\'utilisation de Second Brain',
}

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Guide d'utilisation de Second Brain</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          Bienvenue dans Second Brain, votre assistant personnel pour organiser et gérer vos connaissances.
          Ce guide vous aidera à tirer le meilleur parti de l'application.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Navigation</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium mb-2">Barre de navigation</h3>
            <p>La barre de navigation en haut de l'écran vous permet d'accéder aux différentes sections de l'application :</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Accueil : Retour à la page principale</li>
              <li>Notes : Gestion de vos notes</li>
              <li>Projets : Organisation de vos projets</li>
              <li>Paramètres : Configuration de l'application</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Gestion des notes</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium mb-2">Création d'une note</h3>
            <p>Pour créer une nouvelle note :</p>
            <ol className="list-decimal pl-6 mt-2">
              <li>Cliquez sur le bouton "Nouvelle note"</li>
              <li>Donnez un titre à votre note</li>
              <li>Rédigez votre contenu</li>
              <li>Cliquez sur "Enregistrer"</li>
            </ol>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">Organisation des notes</h3>
            <p>Vous pouvez organiser vos notes en :</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Utilisant des tags</li>
              <li>Créant des dossiers</li>
              <li>Utilisant la fonction de recherche</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Fonctionnalités avancées</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium mb-2">Intégration IA</h3>
            <p>Second Brain intègre des fonctionnalités d'IA pour vous aider :</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Génération de contenu</li>
              <li>Suggestions d'organisation</li>
              <li>Recherche intelligente</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Astuces et bonnes pratiques</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium mb-2">Organisation efficace</h3>
            <ul className="list-disc pl-6">
              <li>Utilisez des tags cohérents</li>
              <li>Créez une structure de dossiers logique</li>
              <li>Revoyez régulièrement vos notes</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Support</h2>
        <p>
          Si vous rencontrez des problèmes ou avez des questions, n'hésitez pas à nous contacter à l'adresse support@secondbrain.com
        </p>
      </section>
    </div>
  )
} 