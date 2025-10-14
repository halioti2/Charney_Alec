import React, { useState } from 'react';

/**
 * @param {object} props
 * @param {string[]} props.items
 * @param {Record<string, File>} props.attachedFiles
 * @param {React.Dispatch<React.SetStateAction<Record<string, File>>>} props.onFileDrop
 */
const ComplianceChecklist = ({ items = [], attachedFiles = {}, onFileDrop }) => {
  const [draggedOverItem, setDraggedOverItem] = useState(null);

  const handleDragOver = (e, name) => {
    e.preventDefault();
    setDraggedOverItem(name);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDraggedOverItem(null);
  };

  const handleDrop = (e, name) => {
    e.preventDefault();
    setDraggedOverItem(null);
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileDrop(prevFiles => ({ ...prevFiles, [name]: file }));
    }
  };

  const handleToggle = (name) => {
    if (!attachedFiles[name]) {
      // If not checked, simulate a file attachment
      const mockFile = new File([''], 'verified.txt', { type: 'text/plain' });
      onFileDrop(prevFiles => ({ ...prevFiles, [name]: mockFile }));
    } else {
      // If checked, remove the file
      onFileDrop(prevFiles => {
        const newFiles = { ...prevFiles };
        delete newFiles[name];
        return newFiles;
      });
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold dark:text-charney-white">Compliance Checklist</h3>
      <p className="text-sm text-charney-gray/80 dark:text-charney-gray/60">
        Drag & drop files onto each item. Submission is blocked until all items are complete.
      </p>
      <div className="space-y-2 pt-2">
        {items.map((name) => {
          const file = attachedFiles[name];
          const isChecked = !!file;
          const isDraggedOver = draggedOverItem === name;

          return (
            <div
              key={name}
              onDragOver={(e) => handleDragOver(e, name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, name)}
              className={`rounded-lg border-2 p-4 transition-all ${
                isDraggedOver
                  ? 'border-charney-red bg-charney-red/5 dark:border-charney-red dark:bg-charney-red/10'
                  : isChecked
                  ? 'border-charney-red/80 bg-charney-red/5 dark:border-charney-red dark:bg-charney-red/10'
                  : 'border-dashed border-charney-light-gray/60 hover:border-charney-light-gray dark:border-charney-gray/20 dark:hover:border-charney-gray/40'
              }`}
            >
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleToggle(name)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleToggle(name);
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-charney-light-gray text-charney-red focus:ring-charney-red focus:ring-offset-2 focus:ring-offset-charney-white dark:border-charney-gray/20 dark:text-charney-red dark:focus:ring-offset-charney-charcoal dark:checked:border-charney-red cursor-pointer"
                    checked={isChecked}
                    onChange={() => handleToggle(name)}
                    aria-label={`Mark ${name} as verified`}
                  />
                  <span className="text-sm font-medium select-none dark:text-charney-white/90">{name}</span>
                </div>
                {isChecked && (
                  <span className="text-xs font-medium text-charney-red dark:text-charney-red">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComplianceChecklist;