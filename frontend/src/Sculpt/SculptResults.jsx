import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

// --- MODAL COMPONENT ---
const RationaleModal = ({ isOpen, onClose, rationale, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFF9F0] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative border-4 border-[#E6D5B8]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4C3B6F]"></div>
              <p className="text-[#4C3B6F] font-medium animate-pulse">Consulting the AI Advisor...</p>
            </div>
          ) : (
            <div className="prose prose-purple prose-lg">
              {/* Render the Markdown from Gemini */}
              <ReactMarkdown components={{
                h1: ({node, ...props}) => <h1 className="serif-title align-middle text-4xl font-bold text-[#4C3B6F] mb-4" {...props} />,
                strong: ({node, ...props}) => <span className="font-bold text-gray-900" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 text-gray-700" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                p: ({node, ...props}) => <p className="text-gray-600 mb-4 leading-relaxed" {...props} />
              }}>
                {rationale}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// A single row for a suggested course
const SuggestedCourseItem = ({ term, code, credits, title, category }) => {
  // Simple mapping for the key/legend
  const categoryColors = {
    "Tech Elective": "bg-gray-800",
    "Gen Ed": "bg-green-500",
    "Major": "bg-red-500",
    "Minor": "bg-purple-500",
    "Concentration": "bg-yellow-500",
    "Free Elective": "bg-blue-500",
  };
  const categoryColor = categoryColors[category] || "bg-gray-400";

  return (
    <div className="flex items-center space-x-4 py-3 border-b border-gray-200">
      <div className={`${categoryColor} w-2 h-2 rounded-full`}></div>
      <span className="w-16 font-medium text-gray-500">{term}</span>
      <span className="w-20 font-bold text-gray-800">{code}</span>
      <span className="w-16 text-gray-600">{credits.toFixed(2)}</span>
      <span className="flex-1 text-gray-800">{title}</span>
    </div>
  );
};

// The legend component
const Legend = () => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600 mb-6">
    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-gray-800 mr-1"></div>Tech Elective</span>
    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>Gen Ed</span>
    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>Major</span>
    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>Minor</span>
    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>Concentration</span>
    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>Free Elective</span>
  </div>
);

export default function SculptResults({ plan, preferences, onGenerateNew, rationale, isRationaleLoading }) {
  const [showModal, setShowModal] = useState(false);

  if (!plan) return <div className="text-center"><p className="text-gray-500">Generating...</p></div>;
  
  const getCategory = (course) => {
    // Check if the planSolver attached a category (from my updated code above)
    if (course.category) return course.category;
    
    // Fallback logic
    if (preferences.requirements.includes("Technical Electives") && course.subject === "CS") return "Tech Elective";
    return "Free Elective";
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="text-center mb-6">
        <h2 className="serif-title text-5xl lg:text-7xl font-bold brand-purple leading-tight mb-3">
          Suggested Courses
        </h2>
        <p className="text-lg text-gray-500">
          Based off of your requirements and priorities
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        {plan.plan.length > 0 ? (
          plan.plan.map(course => (
            <SuggestedCourseItem
              key={course.code}
              term="SP26"
              code={course.code}
              credits={course.credits}
              title={course.title}
              category={getCategory(course)}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No courses found matching criteria.</p>
        )}
      </div>

      {/* Info Button - Triggers Modal */}
      <div className="text-center mb-6">
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white text-[#4C3B6F] font-semibold py-2 px-5 rounded-full border-2 border-[#4C3B6F] hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center mx-auto"
        >
          <span className="">✨</span> Why Were These Courses Chosen?
        </button>
      </div>

      {/* Rationale Modal */}
      <RationaleModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        rationale={rationale} 
        isLoading={isRationaleLoading} 
      />

      {/* Summary and Actions */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-lg font-bold text-gray-800">
            Credit Load: <span className="font-normal text-gray-600">{plan.totalCredits} Credit Hours</span>
          </p>
          <p className="text-lg font-bold text-gray-800">
            Semester Difficulty: <span className="font-normal text-gray-600">{preferences.difficulty}</span>
          </p>
        </div>
        <div className="flex flex-col space-y-3">
          <button className="px-6 py-3 bg-[#4C3B6F] text-white font-bold rounded-full hover:bg-[#392d57] transition-all">
            Confirm Semester Plan
          </button>
          <button 
            onClick={onGenerateNew}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-full hover:bg-gray-300 transition-all"
          >
            Generate New Plan
          </button>
        </div>
      </div>
    </div>
  );
}