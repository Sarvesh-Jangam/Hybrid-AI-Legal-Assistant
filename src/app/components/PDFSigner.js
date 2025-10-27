'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';

export default function PDFSigner({ signature, onClose, preloadedFile }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null); // Store original File object
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [signatures, setSignatures] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load preloaded file on component mount
  useEffect(() => {
    const loadPreloadedFile = async () => {
      if (preloadedFile) {
        setIsProcessing(true);
        try {
          const arrayBuffer = await preloadedFile.arrayBuffer();
          setPdfFile(arrayBuffer);
          setOriginalFile(preloadedFile); // Store original file
          await renderPDF(arrayBuffer);
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
      await renderPDF(arrayBuffer);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render PDF using pdf.js
  const renderPDF = async (pdfData) => {
    try {
      // Dynamically import pdf.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set up worker using the local package
      try {
        // Import the worker from the local package
        const workerSrc = await import('pdfjs-dist/build/pdf.worker.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default || workerSrc;
        console.log('Using local pdfjs-dist worker');
      } catch (workerError) {
        console.warn('Failed to load local worker, trying CDN fallback:', workerError);
        // Fallback to CDN with matching version
        const workerUrls = [
          'https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.js',
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.worker.min.js'
        ];
        
        let workerLoaded = false;
        for (const workerUrl of workerUrls) {
          try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
            console.log('Using CDN worker:', workerUrl);
            workerLoaded = true;
            break;
          } catch (error) {
            console.warn('CDN Worker failed:', workerUrl, error);
            continue;
          }
        }
        
        if (!workerLoaded) {
          console.warn('All workers failed, disabling worker');
          pdfjsLib.GlobalWorkerOptions.workerSrc = null;
        }
      }
      
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        verbosity: 0  // Reduce logging
      });
      
      const pdf = await loadingTask.promise;
      const pages = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        // Create canvas for this page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        pages.push({
          canvas: canvas,
          width: viewport.width,
          height: viewport.height,
          pageNumber: i
        });
      }
      
      setPdfPages(pages);
      setCurrentPage(0);
    } catch (error) {
      console.error('Error rendering PDF:', error);
      alert(`Error rendering PDF: ${error.message}. Please try refreshing the page or using a different PDF file.`);
    }
  };

  // Handle click on PDF to place signature
  const handlePDFClick = (event) => {
    if (!signature) {
      alert('Please create a signature first');
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newSignature = {
      id: Date.now(),
      x: x,
      y: y,
      page: currentPage,
      signature: signature
    };
    
    setSignatures([...signatures, newSignature]);
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

      for (const sig of signatures) {
        const page = pages[sig.page];
        if (!page) continue;

        // Convert signature image to PDF image
        const signatureImage = await pdfDoc.embedPng(sig.signature);
        const { width, height } = page.getSize();
        
        // Calculate position (flip Y coordinate because PDF coordinates start from bottom)
        const pdfX = (sig.x / pdfPages[sig.page].width) * width;
        const pdfY = height - (sig.y / pdfPages[sig.page].height) * height;
        
        // Add signature to PDF
        page.drawImage(signatureImage, {
          x: pdfX - 50, // Center the signature
          y: pdfY - 25,
          width: 100,
          height: 50,
        });
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
          <h2 className="text-2xl font-bold text-gray-800">📄 PDF Document Signer</h2>
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
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {pdfPages.length}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(pdfPages.length - 1, currentPage + 1))}
                    disabled={currentPage === pdfPages.length - 1}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
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

              {/* PDF Page Display */}
              {pdfPages.length > 0 && (
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">Click anywhere on the document to place your signature</p>
                  <div className="relative max-h-[60vh] overflow-auto bg-white rounded border border-gray-200">
                    {pdfPages[currentPage] && (
                      <div
                        className="relative cursor-crosshair inline-block"
                        onClick={handlePDFClick}
                      >
                        <div
                          className="relative border border-gray-300 shadow-lg"
                          style={{
                            width: pdfPages[currentPage].width,
                            height: pdfPages[currentPage].height,
                            minWidth: '100%'
                          }}
                        >
                          <img
                            src={pdfPages[currentPage].canvas.toDataURL()}
                            alt={`PDF Page ${currentPage + 1}`}
                            className="w-full h-full block"
                            draggable={false}
                          />
                        </div>
                        
                        {/* Render signatures for current page */}
                        {signatures
                          .filter(sig => sig.page === currentPage)
                          .map(sig => (
                            <div
                              key={sig.id}
                              className="absolute border-2 border-blue-500 bg-white bg-opacity-80 rounded cursor-pointer"
                              style={{
                                left: sig.x - 50,
                                top: sig.y - 25,
                                width: 100,
                                height: 50
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
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Click anywhere on the PDF to place your signature</li>
                  <li>• Click on placed signatures to remove them</li>
                  <li>• Use Previous/Next to navigate between pages</li>
                  <li>• Download the signed PDF when you're done</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
