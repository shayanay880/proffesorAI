import React from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transform transition-all animate-fade-in-up overflow-hidden">
        
        {/* Scrollable Content Area */}
        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              {/* Added explicit width/height to SVG to prevent layout shift if CSS fails */}
              <svg 
                className="h-7 w-7 text-red-600" 
                width="28" 
                height="28" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Important Disclaimer</h2>
          </div>
          
          <div className="text-gray-600 space-y-4 text-base leading-relaxed">
            <p>
              This AI Medical Assistant is for <strong>informational and educational purposes only</strong>. It is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
              <p className="text-red-800 text-sm font-medium">
                <strong>Always seek the advice of your physician</strong> or other qualified health provider with any questions regarding a medical condition.
              </p>
            </div>
            <p>
              Never disregard professional medical advice or delay in seeking it because of something you have read from this AI.
            </p>
            <p className="font-semibold text-gray-800">
              If you think you may have a medical emergency, call your doctor, go to the emergency department, or call your local emergency number immediately.
            </p>
          </div>
        </div>

        {/* Footer with Button */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onAccept}
            className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98]"
          >
            I Understand and Accept
          </button>
        </div>

      </div>
      <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};