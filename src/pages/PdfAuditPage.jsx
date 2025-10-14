import React, { useState, useEffect } from 'react';
import DealSheetViewer from '../components/DealSheetViewer.jsx';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import VerificationForm from '../components/VerificationForm.jsx';
import ComplianceChecklist from '../components/ComplianceChecklist.jsx';

const checklistItemsConfig = ["Contract of Sale", "Invoice", "Disclosure Forms"];

const initialFormData = {
  property_address: "123 Main Street, Brooklyn, NY 11201",
  final_sale_price: 1500000,
  gci_total: 45000,
  final_agent_name: "Ashley Carter",
  final_agent_split_percent: 50,
  net_payout_to_agent: 19505,
};

const PdfAuditPage = () => {
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [formData, setFormData] = useState(initialFormData);
  const [attachedFiles, setAttachedFiles] = useState({});

  useEffect(() => {
    const allItemsAttached = checklistItemsConfig.every(item => attachedFiles[item]);
    setIsSubmitDisabled(!allItemsAttached);
  }, [attachedFiles]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleChecklistItemToggle = (itemName) => {
    // This function is now deprecated by file drops, but we can keep it for manual overrides if needed.
    // For now, we'll have it clear a file to uncheck it.
    const newFiles = { ...attachedFiles };
    delete newFiles[itemName];
    setAttachedFiles(newFiles);
  };

  const handleSubmit = () => {
    console.log("Submitting for approval...");
    console.log("Form Data:", formData);
    console.log("Attached Files:", attachedFiles);
    // Next step: Send this data to a backend API/webhook.
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PDF Audit Workflow</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Panel: Document Viewer */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Deal Sheet Viewer</h2>
            <DealSheetViewer />
          </div>

          {/* Right Panel: Verification Hub */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold">Verification Hub</h2>
            <ConfidenceBadge />
            <VerificationForm formData={formData} onFormChange={handleFormChange} />
            <ComplianceChecklist
              items={checklistItemsConfig}
              attachedFiles={attachedFiles}
              onFileDrop={setAttachedFiles}
            />
            <button
              type="button"
              disabled={isSubmitDisabled}
              onClick={handleSubmit}
              className="w-full text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed enabled:bg-red-600 enabled:hover:bg-red-700"
            >
              Submit for Broker Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfAuditPage;