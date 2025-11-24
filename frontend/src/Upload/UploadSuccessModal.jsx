  import React from 'react';
  import { Link } from 'react-router-dom';

  const UploadSuccess = ({ parsedData, onClose }) => {
    if (!parsedData) return null;

    const { studentInfo, completedCourses, inProgressCourses} = parsedData;

    const completedCodes = completedCourses?.map(c => c.code).join(", ") || "None found";
    const inProgressCodes = inProgressCourses?.map(c => c.code).join(", ") || "None found";

    return (
      <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl relative mx-4">
          
          {/* Decorative header text */}
          <div className="text-center mb-6">
            <h2 className="serif-title text-3xl font-bold text-[#4C3B6F] mb-2">
              Audit Uploaded Successfully!
            </h2>
            <p className="text-gray-600 text-sm">
              Your UIC Degree Audit has been processed and your progress is now ready to view.
            </p>
          </div>

          {/* --- VALIDATION SECTION --- */}
          {/* This allows the user to verify the LLM didn't hallucinate their info */}
          <div className="bg-[#FAF8F5] border border-gray-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Please Verify Your Details
            </p>

            {/* --- STUDENT INFO GRID --- */}
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div>
                <span className="block text-gray-500 text-xs">Name</span>
                <span className="font-semibold text-gray-800">{studentInfo?.name || "Not found"}</span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs">UIN</span>
                <span className="font-semibold text-gray-800">{studentInfo?.uin || "Not found"}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-gray-500 text-xs">Major</span>
                <span className="font-semibold text-gray-800">{studentInfo?.major || "Not found"}</span>
              </div>

              {/* --- COURSE GRID --- */}
              <div className="col-span-2 mt-4">
                <span className="block text-gray-500 text-xs">Completed Course Codes</span>
                <span className="font-semibold text-gray-800">{completedCodes}</span>
              </div>

              <div className="col-span-2">
                <span className="block text-gray-500 text-xs">In-Progress Course Codes</span>
                <span className="font-semibold text-gray-800">{inProgressCodes}</span>
              </div>

            </div>
          </div>

          {/* Action List */}
          <div className="text-left mb-8 space-y-3 text-gray-600 text-sm">
            <p>From here, you can:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-[#4C3B6F]">Review your degree progress</strong> — see what's completed, in progress, or remaining</li>
              <li><strong className="text-[#4C3B6F]">Sculpt your next semester</strong> using your uploaded audit data</li>
              <li>Or <strong className="text-[#4C3B6F]">Ask the AI Asisstant</strong> to find courses that interest you</li>
            </ul>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-4">

          {/* Left-aligned Re-upload button */}
          <Link
            to="/audit"
            className="bg-[#f0e5d7] hover:bg-[#e9dccb] text-[#4C3B6F] rounded-full p-3 py-2 text-sm transition-transform transform hover:scale-110 shadow-lg"
          >
            Re-upload Audit
          </Link>

          {/* Right-aligned Continue button */}
          <Link 
            to="/dashboard" 
            className="bg-[#4C3B6F] hover:bg-[#392d57] text-white rounded-full p-3 transition-transform transform hover:scale-110 shadow-lg"
            title="Go to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          </div>
        </div>
      </div>
    );
  };

  export default UploadSuccess;