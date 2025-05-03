import Link from 'next/link'

// Import dynamique de la version depuis package.json
// @ts-ignore
const version = require('../package.json').version;

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Second Brain. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-500">Version : v{version}</p>
          <div className="flex space-x-6">
            <Link 
              href="/cookies" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cookies
            </Link>
            <Link 
              href="/privacy" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Confidentialité
            </Link>
            <Link
              href="/help"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Aide
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Conditions d'utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 