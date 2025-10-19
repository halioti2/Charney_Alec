import React from 'react';

const CommissionTestButton = () => {
    const handleClick = () => {
        console.log('Test button clicked!');
    };

    return (
        <button 
            onClick={handleClick} 
            className="bg-blue-500 text-white p-2 rounded"
        >
            Test Button
        </button>
    );
};

export default CommissionTestButton;