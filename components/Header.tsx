import Link from 'next/link';
import Logo from './Logo';

export default function Header() {
  return (
    <header className="bg-gray-800 text-white py-3 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 group">
          <Logo className="h-7 w-7 text-gray-300 group-hover:text-white transition-colors" />
          <span className="text-xl font-bold group-hover:text-gray-300 transition-colors">
            Second Brain
          </span>
        </Link>
      </nav>
    </header>
  );
} 