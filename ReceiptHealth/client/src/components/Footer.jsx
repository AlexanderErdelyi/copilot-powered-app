import { Link } from 'react-router-dom';
import { Heart, Github, Mail, ExternalLink } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-3">
        {/* Single line ultra-compact layout */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
          
          {/* Left: Brand + Quick Links */}
          <div className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-400">
            {/* Brand with gradient */}
            <span className="font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Sanitas Mind
            </span>
            
            <span className="text-gray-300 dark:text-gray-600">•</span>
            
            {/* Inline navigation */}
            <Link 
              to="/docs" 
              className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200"
            >
              Docs
            </Link>
            
            <span className="text-gray-300 dark:text-gray-600">•</span>
            
            <Link 
              to="/support" 
              className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200"
            >
              Support
            </Link>
            
            <span className="text-gray-300 dark:text-gray-600">•</span>
            
            <Link 
              to="/privacy" 
              className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200"
            >
              Privacy
            </Link>
            
            <span className="text-gray-300 dark:text-gray-600">•</span>
            
            <Link 
              to="/terms" 
              className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200"
            >
              Terms
            </Link>
            
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
            
            <a 
              href="https://github.com/AlexanderErdelyi/copilot-powered-app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200 inline-flex items-center gap-1 group"
            >
              <Github className="w-3 h-3 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
            
            <a 
              href="mailto:hello@sanitasmind.app"
              className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200 inline-flex items-center gap-1"
            >
              <Mail className="w-3 h-3" />
              <span className="hidden sm:inline">Contact</span>
            </a>
          </div>
          
          {/* Right: Copyright + Status */}
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
            <span className="inline-flex items-center gap-1">
              Made with
              <Heart className="w-3 h-3 text-red-500 fill-current animate-pulse" />
              using AI
            </span>
            
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
            
            <span className="hidden sm:inline">© {currentYear}</span>
            
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
            
            <span className="inline-flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="hidden sm:inline">Online</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
