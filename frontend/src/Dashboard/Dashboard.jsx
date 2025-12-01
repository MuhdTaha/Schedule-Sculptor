// Dashboard.jsx
/**
  * The Dashboard page component that displays the user's progress toward graduation.
  * This component uses the Layout component to maintain consistent styling and structure.
*/

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import CompletedView from "./CompletedView";
import InProgressView from "./InProgressView";
import RemainingView from "./RemainingView";

function Dashboard() {
  const [activeTab, setActiveTab] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const navigate = useNavigate();

  // load parsed audit data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('parsedAuditData');
    if (stored) {
      setParsedData(JSON.parse(stored));
    } else {
      navigate('/audit');
    }
  }, [navigate]);

  // progress data
  if (!parsedData) {
    return <Layout><div>Loading...</div></Layout>
  }
  const progress = parsedData.progress
  const total = progress.totalCreditsRequired
  const completedPercent = (progress.creditsCompleted / total) * 100;
  const inProgressPercent = (progress.creditsInProgress / total) * 100;

  // handles clicking a section (toggle behavior)
  const handleSectionClick = (section) => {
    setActiveTab((prev) => (prev === section ? null : section));
  };

  return (
    <Layout>
      <div className="flex justify-center">
        <div className="w-full max-w-2xl text-center">
          
          {/* Fixed Header Section - Always visible */}
          <div className={`${activeTab ? 'sticky top-0 bg-[#FAF8F5] pt-4 pb-4 z-10 border-b border-gray-200' : ''}`}>
            
            {/* Page Title */}
            <h2 className="serif-title text-4xl font-bold brand-purple mb-4">
              Your Progress Toward Graduation
            </h2>

            <span className="text-gray-600 mb-4 block">Click on each section to get more information</span>

            {/* Progress Bar and Legend */}
            <div className="w-full bg-gray-200 rounded-full h-8 flex overflow-hidden cursor-pointer shadow-inner mb-2 relative text-white font-semibold text-sm">
              
              {/* Completed Section */}
              <div
                className={`h-full flex items-center justify-center transition ${
                  activeTab === "completed" ? "ring-4 ring-[#4C3B6F]/50" : ""
                } bg-[#4C3B6F] hover:brightness-110`}
                style={{ flexBasis: `${completedPercent}%` }}
                onClick={() => handleSectionClick("completed")}
              >
                {progress.creditsCompleted}
              </div>

              {/* In Progress Section */}
              <div
                className={`h-full flex items-center justify-center transition ${
                  activeTab === "inProgress" ? "ring-4 ring-[#9A8FB8]/50" : ""
                } bg-[#9A8FB8] hover:brightness-110`}
                style={{ flexBasis: `${inProgressPercent}%` }}
                onClick={() => handleSectionClick("inProgress")}
              >
                {progress.creditsInProgress}
              </div>

              {/* Remaining Section */}
              <div
                className={`flex-grow h-full flex items-center justify-center transition ${
                  activeTab === "remaining" ? "ring-4 ring-gray-400/50" : ""
                } bg-gray-300 text-gray-700 hover:brightness-110`}
                onClick={() => handleSectionClick("remaining")}
              >
                {progress.creditsRemaining}
              </div>
            </div>

            {/* Legend (Clickable) */}
            <div className="flex justify-center space-x-6 text-sm">
              <div
                className={`flex items-center cursor-pointer hover:font-bold transition ${
                  activeTab === "completed" ? "scale-105 font-semibold" : ""
                }`}
                onClick={() => handleSectionClick("completed")}
              >
                <div className="w-3 h-3 rounded-full mr-2 bg-[#4C3B6F]" />
                <span className="text-gray-600">Completed</span>
              </div>

              <div
                className={`flex items-center cursor-pointer hover:font-bold transition ${
                  activeTab === "inProgress" ? "scale-105 font-semibold" : ""
                }`}
                onClick={() => handleSectionClick("inProgress")}
              >
                <div className="w-3 h-3 rounded-full mr-2 bg-[#9A8FB8]" />
                <span className="text-gray-600">In Progress</span>
              </div>

              <div
                className={`flex items-center cursor-pointer hover:font-bold transition ${
                  activeTab === "remaining" ? "scale-105 font-semibold" : ""
                }`}
                onClick={() => handleSectionClick("remaining")}
              >
                <div className="w-3 h-3 rounded-full mr-2 bg-gray-300" />
                <span className="text-gray-600">Remaining</span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className={`${activeTab ? 'mt-4' : 'mt-10'}`}>
            
            {/* --- Default Message (no tab selected) --- */}
            {!activeTab && (
              <div className="space-y-4 text-gray-600">
                <p className="text-lg lg:text-xl leading-relaxed">
                  Click each category to get more information.
                </p>
                <p className="text-lg lg:text-xl leading-relaxed">
                  Sculpt your semester, or ask your AI assistant what you can do next!
                </p>
              </div>
            )}

            {/* Active view */}
            {activeTab && (
              <div className="text-left bg-slate-50 p-6 rounded-xl shadow transition-all duration-300 h-[350px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeTab === "completed" && <CompletedView data={parsedData} />}
                {activeTab === "inProgress" && <InProgressView data={parsedData} />}
                {activeTab === "remaining" && <RemainingView data={parsedData} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;