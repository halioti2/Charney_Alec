import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const TestPhase1Integration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');

  const testAutoApprovalFlow = async () => {
    setIsLoading(true);
    setResult('Testing Phase 1A - Auto-Approval Flow...\n');
    
    try {
      // Simulate n8n creating a new transaction with auto-approval
      const mockTransactionData = {
        property_address: '789 Test Street, Brooklyn, NY 11201',
        final_sale_price: 2000000,
        final_broker_agent_name: 'Test Agent',
        final_listing_commission_percent: 3.0,
        final_buyer_commission_percent: 2.5,
        status: 'approved',
        intake_status: 'completed',
        agent_id: null,
        brokerage_id: '5cac5c2d-8aa8-4509-92b2-137b590e3b0d',
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(mockTransactionData)
        .select()
        .single();

      if (transactionError) throw transactionError;

      setResult(prev => prev + `✅ Created transaction: ${transaction.id}\n`);

      // Create commission evidence for this transaction
      const mockEvidenceData = {
        transaction_id: transaction.id,
        extraction_data: {
          property_address: mockTransactionData.property_address,
          sale_price: mockTransactionData.final_sale_price,
          broker_agent_name: mockTransactionData.final_broker_agent_name,
          listing_side_commission_percent: mockTransactionData.final_listing_commission_percent,
          buyer_side_commission_percent: mockTransactionData.final_buyer_commission_percent,
        },
        confidence: 98,
        requires_review: false,
        source_document_type: 'contract',
      };

      const { data: evidence, error: evidenceError } = await supabase
        .from('commission_evidences')
        .insert(mockEvidenceData)
        .select()
        .single();

      if (evidenceError) throw evidenceError;

      setResult(prev => prev + `✅ Created commission evidence: ${evidence.id}\n`);

      // Create transaction event
      const { error: eventError } = await supabase
        .from('transaction_events')
        .insert({
          transaction_id: transaction.id,
          event_type: 'auto_approved',
          actor_name: 'n8n Workflow',
          metadata: { confidence: 98, auto_approval: true },
        });

      if (eventError) throw eventError;

      setResult(prev => prev + `✅ Created transaction event\n`);
      setResult(prev => prev + `🎉 Phase 1A Auto-Approval Test Completed Successfully!\n`);
      setResult(prev => prev + `The coordinator queue should now show this transaction with "Approved" status.\n`);

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error.message}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const testManualReviewFlow = async () => {
    setIsLoading(true);
    setResult('Testing Phase 1B - Manual Review Flow...\n');
    
    try {
      // Create a transaction that needs review
      const mockTransactionData = {
        property_address: '456 Review Street, Brooklyn, NY 11201',
        final_sale_price: 1800000,
        final_broker_agent_name: 'Review Agent',
        status: 'in_queue',
        intake_status: 'in_review',
        agent_id: null,
        brokerage_id: '5cac5c2d-8aa8-4509-92b2-137b590e3b0d',
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(mockTransactionData)
        .select()
        .single();

      if (transactionError) throw transactionError;

      setResult(prev => prev + `✅ Created transaction needing review: ${transaction.id}\n`);

      // Create commission evidence that requires review
      const mockEvidenceData = {
        transaction_id: transaction.id,
        extraction_data: {
          property_address: mockTransactionData.property_address,
          sale_price: mockTransactionData.final_sale_price,
          broker_agent_name: mockTransactionData.final_broker_agent_name,
          listing_side_commission_percent: 3.0,
          buyer_side_commission_percent: 2.5,
          detected_conflicts: ['Commission rate mismatch', 'Missing buyer signature'],
        },
        confidence: 75,
        requires_review: true,
        source_document_type: 'contract',
      };

      const { data: evidence, error: evidenceError } = await supabase
        .from('commission_evidences')
        .insert(mockEvidenceData)
        .select()
        .single();

      if (evidenceError) throw evidenceError;

      setResult(prev => prev + `✅ Created commission evidence requiring review: ${evidence.id}\n`);

      // Create transaction event
      const { error: eventError } = await supabase
        .from('transaction_events')
        .insert({
          transaction_id: transaction.id,
          event_type: 'needs_review',
          actor_name: 'n8n Workflow',
          metadata: { confidence: 75, conflicts: mockEvidenceData.extraction_data.detected_conflicts },
        });

      if (eventError) throw eventError;

      setResult(prev => prev + `✅ Created transaction event\n`);
      setResult(prev => prev + `🎉 Phase 1B Manual Review Test Completed Successfully!\n`);
      setResult(prev => prev + `The coordinator queue should now show this transaction with "Needs Review" status.\n`);
      setResult(prev => prev + `Click "Process" to open the verification modal and approve it.\n`);

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error.message}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResult('');
  };

  return (
    <div className="rounded-lg border border-charney-light-gray/60 bg-charney-white p-6 dark:border-charney-gray/20 dark:bg-charney-charcoal">
      <h3 className="mb-4 text-xl font-bold text-charney-black dark:text-charney-white">
        Phase 1A & 1B Integration Test
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
          <span className="ml-2 text-charney-gray">Running test...</span>
        </div>
      )}
    </div>
  );
};

export default TestPhase1Integration;