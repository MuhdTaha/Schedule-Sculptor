// Layout.jsx
/**
 * A reusable layout component that provides the three-column structure and header.
 * It accepts `children`, which is the unique content for each page.
*/

import React from 'react';
import { Link } from 'react-router-dom';
import greekColumn from './assets/greek-column.png';

function Layout({ children }) {
  return (
    <div className="relative min-h-screen font-sans bg-[#FAF8F5] overflow-x-hidden">

      {/* Left Column Pillar */}
      <div className="absolute top-0 left-0 h-full w-1/4 hidden lg:flex items-stretch justify-start pl-2 xl:pl-10 overflow-hidden">
        <img
            src={greekColumn}
            alt="Decorative Greek column"
            className="h-full max-h-[85vh] w-auto max-w-[200px] object-cover opacity-50 translate-y-20 transform scale-x-[-1]"
        />
      </div>

      {/* Right Column Pillar */}
      <div className="absolute top-0 right-0 h-full w-1/4 hidden lg:flex items-stretch justify-end pr-2 xl:pl-10 overflow-hidden">
        <img
          src={greekColumn}
          alt="Decorative Greek column"
          className="h-full max-h-[85vh] w-auto max-w-[200px] object-cover opacity-50 translate-y-20"
        />
      </div>

      {/* Main Content wrapper */}
      <div className="relative z-10 pt-5 flex flex-col min-h-screen">
        <header className="main-container py-8 animate-fade-in">
          <div className="flex justify-between items-center border-b border-gray-300 pb-4">
            <Link to="/" className="serif-title text-2xl font-semibold tracking-wider brand-purple">SCHEDULE SCULPTOR</Link>
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
              <Link to="/audit" className="hover:text-purple-800 transition-colors">Upload Audit</Link>
              <Link to="/dashboard" className="hover:text-purple-800 transition-colors">Dashboard</Link>
              <a href="#" className="hover:text-purple-800 transition-colors">Sculpt your Semester</a>
              <a href="#" className="hover:text-purple-800 transition-colors">AI Assistant</a>
            </nav>
            <div className="md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </div>
          </div>
        </header>

        {/* This is where the unique page content will be rendered */}
        <div className="flex-grow flex items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <main className="main-container">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;
