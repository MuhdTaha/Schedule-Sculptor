// Dashboard.jsx
/**
 * The Dashboard page component that displays the user's progress toward graduation.
 * This component uses the Layout component to maintain consistent styling and structure.
*/

import React from 'react';
import Layout from './Layout';

// A reusable component for the legend items below the progress bar
const LegendItem = ({ colorClass, label }) => (
  <div className="flex items-center">
    <div className={`w-3 h-3 rounded-full mr-2 ${colorClass}`}></div>
    <span className="text-sm text-gray-600">{label}</span>
  </div>
);

function Dashboard() {
  const progress = { completed: 60, inProgress: 16, remaining: 44 };
  const total = progress.completed + progress.inProgress + progress.remaining;
  const completedPercent = (progress.completed / total) * 100;
  const inProgressPercent = (progress.inProgress / total) * 100;

  return (
    <Layout>
      <div className="flex justify-center">
        <div className="w-full max-w-2xl text-center">
          <h2 className="serif-title text-4xl font-bold brand-purple mb-10">
            Your Progress Toward Graduation
          </h2>
          <div className="w-full bg-gray-200 rounded-full h-8 flex overflow-hidden shadow-inner mb-4 relative text-white font-semibold text-sm">
            <div className="bg-[#4C3B6F] h-full flex items-center justify-center" style={{ flexBasis: `${completedPercent}%` }}>
              {progress.completed}
            </div>
            <div className="bg-[#9A8FB8] h-full flex items-center justify-center" style={{ flexBasis: `${inProgressPercent}%` }}>
              {progress.inProgress}
            </div>
            <div className="bg-gray-300 flex-grow h-full flex items-center justify-center text-gray-500">
              {progress.remaining}
            </div>
          </div>
          <div className="flex justify-center space-x-6 mb-12">
            <LegendItem colorClass="bg-[#4C3B6F]" label="Completed" />
            <LegendItem colorClass="bg-[#9A8FB8]" label="In Progress" />
            <LegendItem colorClass="bg-gray-300" label="Remaining" />
          </div>
          <p className="text-lg lg:text-xl text-gray-500 leading-relaxed">
            Click each category to get more information.
          </p>
          <p className="text-lg lg:text-xl text-gray-500 leading-relaxed">
            Sculpt your semester, or ask your AI assistant what you can do next!
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;

