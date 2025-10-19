import React from 'react';

const NoDataState = ({ message = "No closed deals found for this time period." }) => (
  <div className="p-8 text-center text-charney-gray text-lg font-bold">
    {message}
  </div>
);

export default NoDataState;
