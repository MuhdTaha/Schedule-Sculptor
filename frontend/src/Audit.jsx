// Audit.jsx
/**
 * The Audit page component that allows users to upload their UIC Degree Audit PDF.
 * This component uses the Layout component to maintain consistent styling and structure.
*/

import React, { useState, useEffect } from 'react';
import Layout from './Layout';

function Audit() {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState('');
  
  useEffect(() => {
    const storedName = localStorage.getItem('auditFileName');
    if (storedName) {
      setFileName(storedName);
      setStatus('success');
    }
  }, []);

  const handleFile = (file) => {
    if (file && file.type === 'application/pdf') {
      setStatus('processing');
      // ... rest of your file handling logic
      // For now, we'll just simulate success
      setTimeout(() => {
        localStorage.setItem('auditFileName', file.name);
        setFileName(file.name);
        setStatus('success');
      }, 1000);
    } else {
      setErrorMessage('Please upload a valid PDF file.');
      setStatus('error');
    }
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  
  const onBrowseClick = () => {
    if (status === 'idle' || status === 'error') {
      document.getElementById('fileInput').click();
    }
  };
  
  const onFileSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
      localStorage.removeItem('auditFileName');
      setStatus('idle');
      setFileName('');
      setErrorMessage('');
  }

  const renderDropZoneContent = () => {
     switch (status) {
      case 'processing':
        return <p className="text-lg text-gray-500">Processing...</p>;
      case 'success':
        return (
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">Upload Successful!</p>
            <p className="text-sm text-gray-500 mt-1 truncate">{fileName}</p>
            <button onClick={handleReset} className="mt-4 text-sm font-semibold text-red-600 hover:underline z-20 relative">
              Upload a different file
            </button>
          </div>
        );
      case 'error':
         return (
          <div className="text-center">
            <p className="text-lg font-semibold text-red-600">Error</p>
            <p className="text-sm text-gray-500 mt-1">{errorMessage}</p>
            <button onClick={handleReset} className="mt-4 text-sm font-semibold text-blue-600 hover:underline z-20 relative">
              Try Again
            </button>
          </div>
        );
      default: // 'idle'
        return (
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <p className="mt-4 text-lg">Drag and drop file here</p>
            <p className="mt-1 text-sm text-gray-500">
              or <span className="font-semibold text-purple-700">Browse</span>
            </p>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="flex justify-center">
        <div className="w-full max-w-xl text-center">
          <h2 className="serif-title text-5xl lg:text-7xl font-bold brand-purple leading-tight mb-4">
            Start sculpting <br /> your path
          </h2>
          <p className="text-lg lg:text-xl text-gray-500 mb-10">
            Upload your UIC Degree Audit PDF
          </p>
          <div
            className="drop-zone rounded-xl p-10 md:p-16 flex flex-col items-center justify-center cursor-pointer"
            onClick={onBrowseClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {renderDropZoneContent()}
          </div>
          <input 
            type="file" 
            id="fileInput" 
            className="hidden" 
            accept=".pdf"
            onChange={onFileSelected}
          />
        </div>
      </div>
    </Layout>
  );
}

export default Audit;

