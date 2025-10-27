'use client';
import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function SimplePDFSigner({ signature, onClose, preloadedFile }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null); // Store original File object
  const [pdfUrl, setPdfUrl] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSignatureMode, setIsSignatureMode] = useState(false);
  const fileInputRef = useRef(null);
  const iframeRef = useRef(null);

  // Load preloaded file on component mount
  useEffect(() => {
    const loadPreloadedFile = async () => {
      if (preloadedFile) {
        setIsProcessing(true);
        try {
          const arrayBuffer = await preloadedFile.arrayBuffer();
          setPdfFile(arrayBuffer);
          setOriginalFile(preloadedFile); // Store original file
          
          // Create URL for iframe display
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        } catch (error) {
          console.error('Error loading preloaded PDF:', error);
          alert('Error loading PDF file');
        } finally {
          setIsProcessing(false);
        }
      }
    };
    
    loadPreloadedFile();
  }, [preloadedFile]);

  // Handle ESC key to cancel signature mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isSignatureMode) {
        setIsSignatureMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSignatureMode]);

  // Load PDF file
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfFile(arrayBuffer);
      setOriginalFile(file); // Store original file
      
      // Create URL for iframe display
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle click on PDF iframe (simplified approach)
  const handlePDFClick = (event) => {
    if (isSignatureMode) {
      // Get click coordinates relative to the PDF viewer
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newSignature = {
        id: Date.now(),
        x: x,
        y: y,
        signature: signature
      };
      
      setSignatures([...signatures, newSignature]);
      setIsSignatureMode(false); // Disable mode after placing signature
    }
  };

  // Remove signature
  const removeSignature = (id) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
  };

  // Download signed PDF
  const downloadSignedPDF = async () => {
    if (!originalFile || signatures.length === 0) {
      alert('Please add at least one signature before downloading');
      return;
    }

    setIsProcessing(true);
    try {
      // Read fresh ArrayBuffer from original file to avoid detachment issues
      const freshArrayBuffer = await originalFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(freshArrayBuffer);
      const pages = pdfDoc.getPages();
      
      // For simplicity, add all signatures to the first page
      // In a real implementation, you'd track which page each signature belongs to
      const firstPage = pages[0];
      if (firstPage) {
        const { width, height } = firstPage.getSize();
        
        for (const sig of signatures) {
          // Convert signature image to PDF image
          const signatureImage = await pdfDoc.embedPng(sig.signature);
          
          // Calculate position (adjust for PDF coordinate system)
          const pdfX = (sig.x / 800) * width; // Assuming 800px viewer width
          const pdfY = height - (sig.y / 600) * height; // Assuming 600px viewer height, flip Y
          
          // Add signature to PDF
          firstPage.drawImage(signatureImage, {
            x: Math.max(0, pdfX - 50),
            y: Math.max(0, pdfY - 25),
            width: 100,
            height: 50,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      
      // Create a completely new ArrayBuffer copy to avoid detachment issues
      const pdfUint8Array = new Uint8Array(pdfBytes);
      const pdfNewBuffer = new ArrayBuffer(pdfUint8Array.length);
      const pdfNewUint8Array = new Uint8Array(pdfNewBuffer);
      pdfNewUint8Array.set(pdfUint8Array);
      // Download the signed PDF
      const blob = new Blob([pdfNewBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'signed-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Signed PDF downloaded successfully!');
    } catch (error) {
      console.error('Error creating signed PDF:', error);
      alert('Error creating signed PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📄 Simple PDF Document Signer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {!pdfFile ? (
            // File upload section
            <div className="text-center py-12">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload PDF Document</h3>
              <p className="text-gray-500 mb-6">Select a PDF file to add your signature</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isProcessing ? 'Loading...' : 'Choose PDF File'}
              </button>
            </div>
          ) : (
            // PDF viewer and signing section
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">
                  Click on the PDF preview below to place signatures
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Signatures: {signatures.length}</span>
                  <button
                    onClick={downloadSignedPDF}
                    disabled={signatures.length === 0 || isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {isProcessing ? 'Processing...' : 'Download Signed PDF'}
                  </button>
                </div>
              </div>

              {/* PDF Display */}
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">📄 You can scroll within the PDF below. The PDF will open in your browser's built-in viewer.</p>
                <div className="space-y-4">
                  {/* PDF Preview Container */}
                  <div className="relative inline-block w-full">
                    <div
                      className="relative bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden"
                      style={{
                        width: '100%',
                        height: '600px',
                        maxWidth: '800px',
                        margin: '0 auto'
                      }}
                    >
                      {/* PDF Preview using iframe with scrolling enabled */}
                      <iframe
                        ref={iframeRef}
                        src={pdfUrl}
                        className="w-full h-full rounded-lg"
                        title="PDF Preview - You can scroll and zoom within this viewer"
                        style={{
                          border: 'none',
                          pointerEvents: isSignatureMode ? 'none' : 'auto'
                        }}
                      />
                      
                      {/* Interactive overlay for signature placement */}
                      {isSignatureMode && (
                        <div
                          className="absolute inset-0 cursor-crosshair bg-transparent border-2 border-blue-400 border-dashed rounded-lg"
                          onClick={handlePDFClick}
                          style={{
                            zIndex: 10
                          }}
                        >
                          {/* Floating instruction tooltip in top-right corner */}
                          <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none text-center">
                            <p className="text-xs font-medium">🎯 Click to place signature</p>
                            <p className="text-xs opacity-75">ESC to cancel</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Render placed signatures as overlays */}
                      {signatures.map(sig => (
                        <div
                          key={sig.id}
                          className="absolute border-2 border-blue-500 bg-white bg-opacity-95 rounded cursor-pointer shadow-lg transition-all hover:shadow-xl"
                          style={{
                            left: sig.x - 50,
                            top: sig.y - 25,
                            width: 100,
                            height: 50,
                            zIndex: 5
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSignature(sig.id);
                          }}
                          title="Click to remove signature"
                        >
                          <img
                            src={sig.signature}
                            alt="Signature"
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Signature Placement Controls */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">🖊️ Add Signature</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      {isSignatureMode ? 
                        '🎯 Click anywhere on the PDF above to place your signature (Press ESC to cancel)' :
                        'Click the button below, then click on the PDF to place your signature precisely where you want it.'
                      }
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (!signature) {
                            alert('Please create a signature first');
                            return;
                          }
                          setIsSignatureMode(true);
                        }}
                        disabled={isSignatureMode}
                        className={`px-4 py-2 rounded-lg font-medium shadow-md transition-all ${
                          isSignatureMode 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isSignatureMode ? '🎯 Click on PDF above' : '🖊️ Place Signature'}
                      </button>
                      {isSignatureMode && (
                        <button
                          onClick={() => setIsSignatureMode(false)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium shadow-md transition-all"
                        >
                          ❌ Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Signature List */}
                  {signatures.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">✅ Signatures Added ({signatures.length})</h4>
                      <div className="space-y-2">
                        {signatures.map((sig, index) => (
                          <div key={sig.id} className="flex items-center justify-between bg-white rounded p-2 border border-green-200">
                            <span className="text-sm text-green-700">Signature #{index + 1}</span>
                            <button
                              onClick={() => removeSignature(sig.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Click "🖊️ Place Signature" button, then click on the PDF to place your signature</li>
                  <li>• Click on placed signatures to remove them</li>
                  <li>• You can scroll and zoom within the PDF viewer</li>
                  <li>• Download the signed PDF when you're done</li>
                </ul>
              </div>
              
              {/* Multi-page Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-800 mb-2">⚠️ Important Limitation:</h4>
                <p className="text-sm text-orange-700 mb-2">
                  <strong>Simple PDF Signer only places signatures on the first page</strong> regardless of where you scroll or click in the PDF viewer.
                </p>
                <p className="text-sm text-orange-700">
                  For multi-page documents, use the <strong>"Advanced PDF Signer"</strong> which supports page-by-page navigation and accurate signature placement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
