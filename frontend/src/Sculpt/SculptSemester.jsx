import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { useData } from './DataContext';
import { generatePlan, generateRationale } from '../lib/planSolver';
import SculptForm from './SculptForm'; 
import SculptResults from './SculptResults'; 

export default function SculptSemester() {
  const { parsedAudit, courseCatalog, isLoading } = useData();

  const navigate = useNavigate();

  // Redirect to /audit if parsedAudit is missing once data finishes loading
  useEffect(() => {
    if (!isLoading && !parsedAudit) {
      console.log("No audit data found, redirecting to /audit");
      navigate('/audit');
    }
  }, [isLoading, parsedAudit, navigate]);
  
  // State to manage which view is active
  const [view, setView] = useState('form'); // 'form' or 'results'

  // State for user's selections from the form
  const [preferences, setPreferences] = useState({
    requirements: [],
    creditLoad: [],
    difficulty: 'Moderate', // Default difficulty
  });

  // State for the generated plan
  const [suggestedPlan, setSuggestedPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rationale, setRationale] = useState("");
  const [isRationaleLoading, setIsRationaleLoading] = useState(false);

  // Get the list of remaining requirements from the audit data
  const remainingRequirements = useMemo(() => {
    return (parsedAudit?.remainingRequirements || []).filter(
      req => req.courses && req.courses.length > 0
    );
  }, [parsedAudit]);

  // This function is called by the form when "Generate" is clicked
  const handleGeneratePlan = (formPrefs) => {
    setIsGenerating(true);
    setPreferences(formPrefs); // Save the user's choices
    setSuggestedPlan(null);

    // Run the "dumb solver"
    setTimeout(async () => {
      const result = generatePlan(formPrefs, parsedAudit, courseCatalog);
      setSuggestedPlan(result);
      setIsGenerating(false);
      setView('results'); // Switch to the results view

      setIsRationaleLoading(true);
      const reasonText = await generateRationale(result, formPrefs, parsedAudit);
      setRationale(reasonText);
      setIsRationaleLoading(false);
    }, 1500); // Fake 1.5s delay
  };

  // This function is called by the results page to go back to the form
  const handleGenerateNewPlan = () => {
    setView('form');
    setSuggestedPlan(null);
    setRationale("");
  };

  if (isLoading) {
    return <Layout><p className="text-center">Loading data...</p></Layout>
  }

  return (
    <Layout>
      <div className="flex justify-center animate-fade-in">
        <div className="w-full max-w-3xl">
          {view === 'form' ? (
            <SculptForm
              remainingRequirements={remainingRequirements}
              initialPrefs={preferences}
              onSubmit={handleGeneratePlan}
              isGenerating={isGenerating}
              hasAuditData={!!parsedAudit}
            />
          ) : (
            <SculptResults
              plan={suggestedPlan}
              preferences={preferences}
              rationale={rationale}
              isRationaleLoading={isRationaleLoading}
              onGenerateNew={handleGenerateNewPlan}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}