'use client';
import { useState } from 'react';

export default function PDFSigningChoice({ 
  signature, 
  onClose, 
  hasUploadedPDF, 
  uploadedFileName, 
  onUseUploadedPDF, 
  onChooseNewPDF 
}) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleProceed = () => {
    if (selectedOption === 'uploaded') {
      onUseUploadedPDF();
    } else if (selectedOption === 'new') {
      onChooseNewPDF();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-2">📄</span>
            Choose PDF to Sign
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm mb-4">
            Which PDF would you like to sign with your signature?
          </p>

          {/* Option 1: Use uploaded PDF */}
          {hasUploadedPDF && (
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedOption === 'uploaded' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption('uploaded')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === 'uploaded' 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedOption === 'uploaded' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Use Currently Uploaded PDF</h3>
                  <p className="text-sm text-gray-600">
                    📄 {uploadedFileName || 'Uploaded document'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Option 2: Choose new PDF */}
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedOption === 'new' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedOption('new')}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedOption === 'new' 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-300'
              }`}>
                {selectedOption === 'new' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Choose New PDF from Computer</h3>
                <p className="text-sm text-gray-600">
                  Select a different PDF file to sign
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={!selectedOption}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedOption
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
