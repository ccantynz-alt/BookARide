import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

/**
 * Simple breadcrumb component for public pages
 * @param {Array} items - Array of {label, href} objects. Last item is current page (no href needed)
 */
const PageBreadcrumb = ({ items = [] }) => {
  return (
    <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center gap-2 text-sm">
          {/* Home link */}
          <li>
            <Link 
              to="/" 
              className="text-gray-400 hover:text-gold transition-colors flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </li>
          
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            
            return (
              <React.Fragment key={index}>
                <li className="text-gray-600">
                  <ChevronRight className="w-4 h-4" />
                </li>
                <li>
                  {isLast ? (
                    <span className="text-gold font-medium">{item.label}</span>
                  ) : (
                    <Link 
                      to={item.href} 
                      className="text-gray-400 hover:text-gold transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default PageBreadcrumb;
