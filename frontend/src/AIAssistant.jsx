/**
 * AI Assistant page component for Schedule Sculptor.
 * Provides a RAG-powered course search interface that matches the app's theme.
 * Users can ask questions about courses and get relevant recommendations.
 */

import React, { useState } from 'react';
import Layout from './Layout';

function AIAssistant() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await fetch('http://localhost:5000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          top_courses: 8
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError('Unable to connect to the AI Assistant. Make sure the backend is running on port 5000.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    "Courses about machine learning",
    "Classes with no prerequisites",
    "Natural language processing courses",
    "Data visualization electives",
    "Intro to computer science"
  ];

  const handleExampleClick = (exampleQuery) => {
    setQuery(exampleQuery);
  };

  return (
    <Layout>
      <div className="py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="serif-title text-4xl md:text-5xl font-bold brand-purple mb-4">
            AI Course Assistant
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ask me anything about courses. I'll help you find the perfect classes based on your interests.
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-3xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'Courses about data science' or 'Classes with no prerequisites'"
              className="w-full px-6 py-4 text-lg border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors bg-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </form>

          {/* Example Queries */}
          {!hasSearched && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(example)}
                    className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {hasSearched && !loading && results.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="serif-title text-2xl font-semibold brand-purple mb-2">
                Found {results.length} {results.length === 1 ? 'course' : 'courses'}
              </h2>
              <p className="text-gray-600">Here are the most relevant courses based on your query.</p>
            </div>

            <div className="space-y-4">
              {results.map((course, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold brand-purple">
                        {course.course_code} {course.course_code && '—'} {course.class_name}
                      </h3>
                      {course.subject && (
                        <p className="text-sm text-gray-500 mt-1">{course.subject}</p>
                      )}
                    </div>
                    <div className="flex items-center bg-purple-50 px-3 py-1 rounded-full">
                      <svg className="w-4 h-4 text-purple-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <span className="text-sm text-purple-700 font-medium">
                        {(course.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {course.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {hasSearched && !loading && results.length === 0 && !error && (
          <div className="max-w-3xl mx-auto text-center py-12">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="serif-title text-2xl font-semibold brand-purple mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 mb-6">
              Try rephrasing your question or using different keywords.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setHasSearched(false);
                setResults([]);
              }}
              className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
            >
              Try Another Search
            </button>
          </div>
        )}

        {/* Initial State - Features */}
        {!hasSearched && !loading && (
          <div className="max-w-4xl mx-auto mt-16">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <h3 className="serif-title text-xl font-semibold brand-purple mb-2">Smart Search</h3>
                <p className="text-gray-600">
                  Ask questions in natural language and get relevant course recommendations instantly.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h3 className="serif-title text-xl font-semibold brand-purple mb-2">Detailed Info</h3>
                <p className="text-gray-600">
                  Get comprehensive course descriptions, prerequisites, and requirements.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h3 className="serif-title text-xl font-semibold brand-purple mb-2">AI-Powered</h3>
                <p className="text-gray-600">
                  Powered by advanced retrieval technology to find the best matches for you.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AIAssistant;
