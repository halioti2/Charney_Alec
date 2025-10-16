import React from 'react';

/**
 * @param {object} props
 * @param {object} props.formData
 * @param {function} props.onFormChange
 */
const VerificationForm = ({ formData = {}, onFormChange }) => {
  const fields = [
    { name: 'property_address', label: 'Property Address', type: 'text' },
    { name: 'final_sale_price', label: 'Final Sale Price', type: 'number', prefix: '$' },
    { name: 'gci_total', label: 'GCI Total', type: 'number', prefix: '$' },
    { name: 'final_agent_name', label: 'Agent Name', type: 'text' },
    { name: 'final_agent_split_percent', label: 'Agent Split %', type: 'number', suffix: '%' },
    { name: 'net_payout_to_agent', label: 'Net Payout to Agent', type: 'number', prefix: '$' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Verification Form
      </h3>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {field.label}
            </label>
            <div className="relative">
              {field.prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {field.prefix}
                </span>
              )}
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={onFormChange}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-red-500 focus:border-transparent
                  ${field.prefix ? 'pl-7' : ''} ${field.suffix ? 'pr-8' : ''}`}
              />
              {field.suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {field.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerificationForm;

