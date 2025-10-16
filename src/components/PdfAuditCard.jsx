import React, { useState, useEffect } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { fetchTransactionForVerification } from '../lib/supabaseService.js';
import { supabase } from '../lib/supabaseClient.js';
import DealSheetViewer from '../components/DealSheetViewer.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';

const checklistItemsConfig = ["Contract of Sale", "Invoice", "Disclosure Forms"];

const PdfAuditCard = () => {
  const { isPdfAuditVisible, currentAuditId, hidePdfAudit, refetchCoordinatorData } = useDashboardContext();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [formData, setFormData] = useState({
    final_broker_agent_name: '',
    property_address: '',
    final_sale_price: '',
    final_listing_commission_percent: '',
    final_buyer_commission_percent: '',
    final_agent_split_percent: '',
    final_co_broker_agent_name: '',
    final_co_brokerage_firm_name: ''
  });
  const [checklistResponses, setChecklistResponses] = useState({});
  const [transactionData, setTransactionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load transaction data when modal opens
  useEffect(() => {
    if (isPdfAuditVisible && currentAuditId) {
      setIsLoading(true);
      fetchTransactionForVerification(currentAuditId)
        .then(data => {
          if (data) {
            setTransactionData(data);
            const evidence = data.commission_evidences?.[0];
            const extractionData = evidence?.extraction_data || {};
            
            // Initialize form with existing data
            setFormData({
              final_broker_agent_name: data.final_broker_agent_name || extractionData.broker_agent_name || "",
              property_address: data.property_address || extractionData.property_address || "",
              final_sale_price: data.final_sale_price || extractionData.sale_price || "",
              final_listing_commission_percent: data.final_listing_commission_percent || extractionData.listing_side_commission_percent || "",
              final_buyer_commission_percent: data.final_buyer_commission_percent || extractionData.buyer_side_commission_percent || "",
              final_agent_split_percent: data.final_agent_split_percent || extractionData.agent_split_percent || "",
              final_co_broker_agent_name: data.final_co_broker_agent_name || extractionData.co_broker_agent_name || "",
              final_co_brokerage_firm_name: data.final_co_brokerage_firm_name || extractionData.co_brokerage_firm_name || "",
            });

            // Initialize checklist
            const initialChecklist = {};
            checklistItemsConfig.forEach(item => {
              initialChecklist[item] = false;
            });
            setChecklistResponses(initialChecklist);
          }
        })
        .catch(error => {
          console.error('Failed to load transaction data:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isPdfAuditVisible, currentAuditId]);

  // Check if form is valid for submission
  useEffect(() => {
    const requiredFields = ['final_broker_agent_name', 'property_address', 'final_sale_price'];
    const isFormValid = requiredFields.every(field => formData[field]?.toString().trim());
    const allItemsChecked = checklistItemsConfig.every(item => checklistResponses[item]);
    setIsSubmitDisabled(!(isFormValid && allItemsChecked));
  }, [formData, checklistResponses]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleChecklistChange = (item, checked) => {
    setChecklistResponses(prev => ({
      ...prev,
      [item]: checked
    }));
  };

  const handleSubmit = async () => {
    if (!transactionData || !currentAuditId || isSubmitDisabled || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting for approval...");
      
      // Clean and validate the form data before sending
      const cleanedFormData = {
        final_broker_agent_name: formData.final_broker_agent_name?.trim() || '',
        property_address: formData.property_address?.trim() || '',
        final_sale_price: formData.final_sale_price ? parseFloat(formData.final_sale_price) || 0 : 0,
        final_listing_commission_percent: formData.final_listing_commission_percent ? parseFloat(formData.final_listing_commission_percent) || 0 : 0,
        final_buyer_commission_percent: formData.final_buyer_commission_percent ? parseFloat(formData.final_buyer_commission_percent) || 0 : 0,
        final_agent_split_percent: formData.final_agent_split_percent ? parseFloat(formData.final_agent_split_percent) || 0 : 0,
        final_co_broker_agent_name: formData.final_co_broker_agent_name?.trim() || '',
        final_co_brokerage_firm_name: formData.final_co_brokerage_firm_name?.trim() || ''
      };

      console.log("Cleaned Form Data:", cleanedFormData);
      console.log("Checklist Responses:", checklistResponses);
      
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Call Netlify function
      const response = await fetch('/.netlify/functions/approve-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          transaction_id: currentAuditId,
          final_data: cleanedFormData,
          checklist_responses: checklistResponses
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve transaction');
      }

      const result = await response.json();
      console.log("Transaction approved successfully:", result);
      
      // Refresh coordinator data to show updated status
      await refetchCoordinatorData();
      hidePdfAudit();
    } catch (error) {
      console.error("Error submitting:", error);
      alert('Failed to approve transaction: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isPdfAuditVisible) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-charney-black/50 backdrop-blur-sm transition-opacity dark:bg-charney-black/90" />
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="relative w-full max-w-6xl rounded-[18px] border border-charney-light-gray/60 bg-charney-white p-8 text-charney-black shadow-charney transition-all dark:border-charney-gray/20 dark:bg-charney-charcoal dark:text-charney-white dark:shadow-none">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 animate-spin text-charney-red" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="mt-4 text-charney-gray">Loading transaction data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const evidence = transactionData?.commission_evidences?.[0];
  const confidence = evidence?.confidence || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-charney-black/50 backdrop-blur-sm transition-opacity dark:bg-charney-black/90" onClick={hidePdfAudit} />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-6xl rounded-[18px] border border-charney-light-gray/60 bg-charney-white p-8 text-charney-black shadow-charney transition-all dark:border-charney-gray/20 dark:bg-charney-charcoal dark:text-charney-white dark:shadow-none">
          <button
            onClick={hidePdfAudit}
            className="absolute right-6 top-6 text-charney-gray/80 transition-colors hover:text-charney-black dark:text-charney-gray/60 dark:hover:text-charney-white"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="space-y-8">
            <div className="border-b border-charney-light-gray/60 pb-6 dark:border-charney-gray/20">
              <h2 className="font-brand text-2xl font-black uppercase tracking-tighter dark:text-charney-white">
                PDF Audit - Commission <span className="text-charney-red">{currentAuditId}</span>
              </h2>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-8">
                <DealSheetViewer />
                <ConfidenceBadge confidence={confidence} />
              </div>

              <div className="space-y-8 dark:text-charney-white">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Verification Form</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Broker/Agent Name</label>
                    <input
                      type="text"
                      name="final_broker_agent_name"
                      value={formData.final_broker_agent_name}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-charney-red dark:bg-charney-charcoal dark:border-charney-gray dark:text-charney-white"
                      placeholder="Enter broker/agent name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Property Address</label>
                    <input
                      type="text"
                      name="property_address"
                      value={formData.property_address}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-charney-red dark:bg-charney-charcoal dark:border-charney-gray dark:text-charney-white"
                      placeholder="Enter property address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Sale Price</label>
                    <input
                      type="number"
                      name="final_sale_price"
                      value={formData.final_sale_price}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-charney-red dark:bg-charney-charcoal dark:border-charney-gray dark:text-charney-white"
                      placeholder="Enter sale price"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Listing Commission %</label>
                      <input
                        type="number"
                        step="0.1"
                        name="final_listing_commission_percent"
                        value={formData.final_listing_commission_percent}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-charney-red dark:bg-charney-charcoal dark:border-charney-gray dark:text-charney-white"
                        placeholder="3.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Buyer Commission %</label>
                      <input
                        type="number"
                        step="0.1"
                        name="final_buyer_commission_percent"
                        value={formData.final_buyer_commission_percent}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-charney-red dark:bg-charney-charcoal dark:border-charney-gray dark:text-charney-white"
                        placeholder="2.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Document Checklist</h3>
                  {checklistItemsConfig.map((item) => (
                    <div key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        id={item}
                        checked={checklistResponses[item] || false}
                        onChange={(e) => handleChecklistChange(item, e.target.checked)}
                        className="h-4 w-4 text-charney-red focus:ring-charney-red border-gray-300 rounded"
                      />
                      <label htmlFor={item} className="ml-2 text-sm">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled || isSubmitting}
                  className={`relative w-full rounded-[8px] border-2 px-8 py-3 font-brand text-xs font-black uppercase tracking-[0.35em] transition-all ${
                    isSubmitDisabled
                      ? 'cursor-not-allowed border-charney-gray/30 bg-charney-gray/30 text-charney-white/50 dark:border-charney-gray/20 dark:bg-charney-gray/20 dark:text-charney-white/30'
                      : isSubmitting
                      ? 'animate-pulse border-charney-red bg-charney-red text-charney-white'
                      : 'border-charney-red bg-charney-red text-charney-white hover:bg-[#E54545] hover:border-[#E54545] focus:outline-none focus-visible:ring-2 focus-visible:ring-charney-red focus-visible:ring-offset-2 focus-visible:ring-offset-charney-charcoal dark:hover:bg-[#FF6B6B] dark:hover:border-[#FF6B6B]'
                  }`}
                >
                  <span className={`flex items-center justify-center space-x-2 ${isSubmitting ? 'opacity-0' : ''}`}>
                    {!isSubmitDisabled && (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{isSubmitDisabled ? 'Complete All Items to Submit' : 'Submit for Approval'}</span>
                  </span>
                  {isSubmitting && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfAuditCard;