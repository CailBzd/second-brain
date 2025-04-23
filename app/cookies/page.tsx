'use client';

export default function CookiesPolicy() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto prose">
        <h1 className="text-3xl font-bold mb-8">Politique des Cookies</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Utilisation des Cookies</h2>
          <p>
            Second Brain n'utilise aucun cookie de suivi ou de publicité. Les seuls cookies utilisés sont ceux 
            strictement nécessaires au fonctionnement technique de l'application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Cookies Techniques</h2>
          <p>
            Les cookies techniques sont utilisés uniquement pour maintenir votre session active pendant 
            l'utilisation de l'application. Ces cookies sont temporaires et sont supprimés lorsque vous 
            fermez votre navigateur.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Contrôle des Cookies</h2>
          <p>
            Vous pouvez contrôler et/ou supprimer les cookies comme vous le souhaitez. Vous pouvez supprimer 
            tous les cookies déjà présents sur votre ordinateur et paramétrer la plupart des navigateurs pour 
            qu'ils les bloquent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Contact</h2>
          <p>
            Pour toute question concernant notre utilisation des cookies, vous pouvez nous contacter à :
            <a href="mailto:pitou.software@gmail.com" className="text-blue-600 hover:text-blue-800">
              pitou.software@gmail.com
            </a>
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