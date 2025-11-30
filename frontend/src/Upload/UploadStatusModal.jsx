// UploadStatusModal.jsx (With Smooth Transitions)
import React, { useState, useEffect } from 'react';

function UploadStatusModal({ status, fileName, onClose }) {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const phrases = [
    "Reading your degree audit...",
    "Extracting course information...",
    "Analyzing completed coursework...",
    "Identifying remaining requirements...",
    "Mapping degree progress...",
    "Finalizing your academic profile...",
    "Almost ready to sculpt..."
  ];

  useEffect(() => {
    if (status !== 'processing') return;
    if (hasReachedEnd) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPhrase((prev) => {
            const nextPhrase = prev + 1;
            if (nextPhrase >= phrases.length) {
                setHasReachedEnd(true);
            }
            return nextPhrase % phrases.length;
        });
        setIsTransitioning(false);
      }, 300);
    }, 9000);

    return () => clearInterval(interval);
  }, [status, phrases.length]);

  if (status !== 'processing') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-auto">
        <div className="p-8 max-h-[80vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-col items-center justify-center py-10 space-y-6">
            {/* Animated Spinner */}
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#4C3B6F]"></div>
            
            {/* Rotating Phrases with Transition */}
            <div className="text-center space-y-2 min-h-[60px] flex items-center justify-center">
              <p 
                className={`text-[#4C3B6F] font-medium text-lg transition-all duration-300 ${
                  isTransitioning ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
                }`}
              >
                {phrases[currentPhrase]}
              </p>
            </div>

            {/* File Name */}
            {fileName && (
              <div className="text-center">
                <p className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full inline-block max-w-xs truncate">
                  📄 {fileName}
                </p>
              </div>
            )}

            {/* Progress Dots */}
            <div className="flex space-x-1 mt-2 mb-4">
              {phrases.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index === currentPhrase ? 'bg-[#4C3B6F]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="text-sm text-gray-200 bg-[#4C3B6F] hover:bg-[#8069af] transition-colors mt-8 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400"
            >
              Cancel Processing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadStatusModal;