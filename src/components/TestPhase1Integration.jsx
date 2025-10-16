import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useDashboardContext } from '../context/DashboardContext.jsx';

const TestPhase1Integration = () => {
  const { refetchCoordinatorData } = useDashboardContext();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');

  const logResult = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setResult(prev => `${prev}[${timestamp}] ${message}\n`);
  };

  const callTestFunction = async (testType) => {
    setIsLoading(true);
    setResult(`Testing ${testType.toUpperCase()}...\n`);
    
    try {
      logResult(`Starting ${testType} test via Netlify function...`);
      
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session - please login first');
      }

      // Call Netlify function
      const response = await fetch('/.netlify/functions/create-test-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          test_type: testType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      logResult(`✅ ${data.message}`);
      logResult(`Transaction ID: ${data.transaction.id}`);
      logResult(`Property: ${data.transaction.property_address}`);
      logResult(`Agent: ${data.transaction.final_broker_agent_name}`);
      logResult(`Status: ${data.transaction.status}`);
      logResult(`Confidence: ${data.evidence.confidence}%`);
      logResult(`Requires Review: ${data.evidence.requires_review}`);
      
      // Manually refresh coordinator data
      await refetchCoordinatorData();
      logResult('🔄 Coordinator data refreshed');
      
      if (testType === 'phase1a') {
        logResult('🎉 Check coordinator queue - should show "Approved" status');
      } else {
        logResult('🎯 Check coordinator queue - should show "Needs Review" status');
        logResult('Click "Process" button to test verification modal');
      }

    } catch (error) {
      logResult(`❌ Error: ${error.message}`);
      console.error(`${testType} test error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAutoApprovalFlow = () => callTestFunction('phase1a');
  const testManualReviewFlow = () => callTestFunction('phase1b');

  const clearResults = () => {
    setResult('');
  };

  const manualRefresh = async () => {
    setIsLoading(true);
    try {
      logResult('🔄 Manual refresh triggered...');
      await refetchCoordinatorData();
      logResult('✅ Coordinator data refreshed successfully');
    } catch (error) {
      logResult(`❌ Refresh failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-charney-light-gray/60 bg-charney-white p-6 dark:border-charney-gray/20 dark:bg-charney-charcoal">
      <h3 className="mb-4 text-xl font-bold text-charney-black dark:text-charney-white">
        🧪 Phase 1A & 1B Integration Test
      </h3>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={testAutoApprovalFlow}
          disabled={isLoading}
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          Test Phase 1A (Auto-Approval)
        </button>
        
        <button
          onClick={testManualReviewFlow}
          disabled={isLoading}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Test Phase 1B (Manual Review)
        </button>
        
        <button
          onClick={manualRefresh}
          disabled={isLoading}
          className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Manual Refresh
        </button>
        
        <button
          onClick={clearResults}
          disabled={isLoading}
          className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Clear Results
        </button>
      </div>

      {result && (
        <div className="rounded border bg-gray-50 p-4 dark:bg-gray-800">
          <h4 className="mb-2 font-semibold text-charney-black dark:text-charney-white">Test Results:</h4>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {result}
          </pre>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <svg className="h-6 w-6 animate-spin text-charney-red" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="ml-2 text-charney-gray">Running test via Netlify function...</span>
        </div>
      )}
    </div>
  );
};

export default TestPhase1Integration;