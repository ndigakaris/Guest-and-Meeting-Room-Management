import React from 'react';

export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#0047FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#737373] text-lg">Loading...</p>
      </div>
    </div>
  );
};
