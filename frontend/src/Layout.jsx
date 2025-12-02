/**
 * A reusable layout component that provides the three-column structure and header.
 * It accepts `children`, which is the unique content for each page.
 */

import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import greekColumn from './assets/greek-column.png'; 

function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = (e) => {
    e.stopPropagation(); 
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation(); 
  };

  return (
    <div className="relative min-h-screen font-sans bg-[#FAF8F5] overflow-x-hidden">

      {/* Left Column Pillar - placed behind everything */}
      <div className="absolute top-0 left-0 h-full w-1/4 hidden lg:flex items-stretch justify-start pl-2 xl:pl-10 overflow-hidden z-0">
        <img
          src={greekColumn}
          alt="Decorative Greek column"
          className="h-full max-h-[85vh] w-auto max-w-[200px] object-cover opacity-50 translate-y-20 transform scale-x-[-1]"
        />
      </div>

      {/* Right Column Pillar - placed behind everything */}
      <div className="absolute top-0 right-0 h-full w-1/4 hidden lg:flex items-stretch justify-end pr-2 xl:pl-10 overflow-hidden z-0">
        <img
          src={greekColumn}
          alt="Decorative Greek column"
          className="h-full max-h-[85vh] w-auto max-w-[200px] object-cover opacity-50 translate-y-20"
        />
      </div>

      {/* Main Content wrapper */}
      <div className="relative z-10 pt-5 flex flex-col min-h-screen">
        
        {/* HEADER */}
        <header className="main-container py-8">
          <div className="flex justify-between items-center border-b border-gray-300 pb-4 relative">
            <Link to="/" className="serif-title text-2xl font-semibold tracking-wider brand-purple">SCHEDULE SCULPTOR</Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
              <Link to="/audit" className="hover:text-purple-800 transition-colors">Upload Audit</Link>
              <Link to="/dashboard" className="hover:text-purple-800 transition-colors">Dashboard</Link>
              <Link to="/sculpt" className="hover:text-purple-800 transition-colors">Sculpt your Semester</Link>
              <Link to="/ai-assistant" className="hover:text-purple-800 transition-colors">AI Assistant</Link>
            </nav>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden focus:outline-none z-50 relative"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Menu & Overlay */}
            {isMenuOpen && (
              <>
                {/* 1. The Overlay: Fixed to cover screen, but z-index 40 */}
                <div 
                  className="fixed inset-0 bg-black/20 z-40 md:hidden" 
                  onClick={closeMenu}
                />

                {/* 2. The Menu: Absolute, z-index 50 (Higher than overlay) */}
                <div 
                  className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 md:hidden animate-fade-in"
                  onClick={handleMenuClick}
                >
                  <nav className="flex flex-col py-2">
                    <Link to="/audit" className="block px-4 py-3 hover:bg-purple-50 hover:text-purple-800 transition-colors text-gray-700" onClick={closeMenu}>
                      Upload Audit
                    </Link>
                    <Link to="/dashboard" className="block px-4 py-3 hover:bg-purple-50 hover:text-purple-800 transition-colors text-gray-700" onClick={closeMenu}>
                      Dashboard
                    </Link>
                    <Link to="/sculpt" className="block px-4 py-3 hover:bg-purple-50 hover:text-purple-800 transition-colors text-gray-700" onClick={closeMenu}>
                      Sculpt your Semester
                    </Link>
                    <Link to="/ai-assistant" className="block px-4 py-3 hover:bg-purple-50 hover:text-purple-800 transition-colors text-gray-700" onClick={closeMenu}>
                      AI Assistant
                    </Link>
                  </nav>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-grow flex items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <main className="main-container w-full">
            {children ? children : <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;