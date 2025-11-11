import React, { createContext, useState, useEffect, useContext } from 'react';

/**
 * A simple CSV-to-JSON parser.
 * This is a basic implementation and assumes no commas within quotes.
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentLine = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Handle commas inside quotes
    
    if (currentLine.length !== headers.length) {
      console.warn("Skipping malformed CSV line:", lines[i]);
      continue;
    }

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const value = (currentLine[j] || '').trim().replace(/"/g, '');
      obj[header] = value;
    }
    result.push(obj);
  }
  return result;
}

// Create the context
const DataContext = createContext(null);

/**
 * This provider loads all necessary data on app start:
 * 1. The user's parsed audit from localStorage.
 * 2. The master course catalog (from chunks.csv).
 */
export function DataProvider({ children }) {
  const [parsedAudit, setParsedAudit] = useState(null);
  const [courseCatalog, setCourseCatalog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Load Parsed Audit Data from Local Storage
        const auditDataString = localStorage.getItem('parsedAuditData');
        if (auditDataString) {
          setParsedAudit(JSON.parse(auditDataString));
        }

        // 2. Load Master Course Catalog from public/chunks.csv
        const response = await fetch(`${import.meta.env.BASE_URL}chunks.csv`);
        if (!response.ok) {
          throw new Error('Failed to fetch course catalog (chunks.csv)');
        }
        
        const csvText = await response.text();
        const catalog = parseCSV(csvText);
        
        // 3. Map the raw CSV data to a cleaner format
        const cleanedCatalog = catalog.map(course => {
          // Extract description from the 'text' field
          const descriptionMatch = course.text.match(/Description: (.*)/);
          const description = descriptionMatch ? descriptionMatch[1] : course.text;
          
          // Parse prereq codes
          const prereqHeader = 'metadata.prereq_codes';
          const prereqs = (course[prereqHeader] && course[prereqHeader] !== '[]')
            ? course[prereqHeader].replace(/[\[\]']/g, '').split(' ').filter(Boolean)
            : [];

          return {
            code: course['metadata.course_code'],
            title: course['metadata.class_name'],
            subject: course['metadata.subject_code'],
            credits: parseFloat(course['metadata.credits_max']) || 3, // Default to 3 credits
            prereqs: prereqs,
            description: description,
          };
        });
        
        setCourseCatalog(cleanedCatalog);

      } catch (error) {
        console.error("Error loading app data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const value = {
    parsedAudit,
    courseCatalog,
    isLoading
  };

  return (
    <DataContext.Provider value={value}>
      {!isLoading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
          <p className="text-lg serif-title">Loading application data...</p>
        </div>
      )}
    </DataContext.Provider>
  );
}

// Custom hook to easily consume the context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === null) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};