// Welcome.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import greekColumn from './assets/greek-column.png';
import logo from './assets/logo.png';

function Welcome() {
  const navigate = useNavigate();
  const [hasUserData, setHasUserData] = useState(false);

  // Check local storage for saved user data
  useEffect(() => {
    const data = localStorage.getItem('userData');
    setHasUserData(!!data);
  }, []);

  const handleButtonClick = () => {
    // If an audit exists, redirect user to dashboard
    if (hasUserData) {
      navigate('/dashboard');
    // If no audit exits, redirect user to upload audit
    } else {
      navigate('/audit');
    }
  };

  return (
    <div className="relative min-h-screen font-sans bg-[#FAF8F5] overflow-x-hidden">

      {/* Left Pillar */}
      <div className="absolute top-0 left-0 h-full w-1/4 hidden lg:flex items-stretch justify-start pl-2 xl:pl-10 overflow-hidden">
        <img
          src={greekColumn}
          alt="Decorative Greek column"
          className="h-full max-h-[85vh] w-auto max-w-[200px] object-cover opacity-50 translate-y-20 transform scale-x-[-1]"
        />
      </div>

      {/* Right Pillar */}
      <div className="absolute top-0 right-0 h-full w-1/4 hidden lg:flex items-stretch justify-end pr-2 xl:pr-10 overflow-hidden">
        <img
          src={greekColumn}
          alt="Decorative Greek column"
          className="h-full max-h-[85vh] w-auto max-w-[200px] object-cover opacity-50 translate-y-20"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <img
          src={logo}
          alt="Schedule Sculptor Logo"
          className="w-40 h-auto mb-8 lg:mb-12"
        />

        <h1 className="serif-title text-5xl lg:text-6xl font-bold brand-purple mb-4">
          Welcome to ScheduleSculptor
        </h1>
        <p className="text-lg lg:text-xl text-gray-500 mb-10">
          Simplify your academic planning with clear, interactive degree paths.
        </p>

        <button
          onClick={handleButtonClick}
          className="px-8 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors text-lg font-medium"
        >
          {hasUserData ? 'View Progress' : 'Get Started'}
        </button>
      </div>
    </div>
  );
}

export default Welcome;
