import React from 'react';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start my-4">
      <div className="max-w-2xl p-4 rounded-xl shadow-md bg-white text-gray-800 rounded-bl-none">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};