'use client';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto prose">
        <h1 className="text-3xl font-bold mb-8">Politique de Confidentialité</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Cette politique de confidentialité explique comment Second Brain (développé par PitLab) traite les informations. 
            Date de dernière mise à jour : {new Date().toLocaleDateString()}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Collecte des Données</h2>
          <p>
            Second Brain ne collecte et ne stocke aucune donnée personnelle. Les questions posées et les réponses générées 
            ne sont pas sauvegardées et sont uniquement utilisées temporairement pour fournir le service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Utilisation de l'API</h2>
          <p>
            L'application utilise l'API Mistral AI pour générer les réponses. Les questions sont transmises à l'API 
            mais ne sont pas stockées de manière permanente.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Contact</h2>
          <p>
            Pour toute question concernant cette politique de confidentialité, vous pouvez nous contacter à :
            <a href="mailto:pitou.software@gmail.com" className="text-blue-600 hover:text-blue-800">
              pitou.software@gmail.com
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Modifications</h2>
          <p>
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
            Les modifications entrent en vigueur dès leur publication sur cette page.
          </p>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} PitLab. Tous droits réservés.
          </p>
        </footer>
      </div>
    </main>
  );
} 