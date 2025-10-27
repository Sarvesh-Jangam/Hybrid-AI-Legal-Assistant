'use client';
import { useRef, useEffect, useState } from "react";
import SignaturePad from "signature_pad";
import PDFSigner from "./PDFSigner";
import SimplePDFSigner from "./SimplePDFSigner";
import PDFSigningChoice from "./PDFSigningChoice";

export default function SignaturePadComponent({ uploadedFile, fileName }) {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const [imageURL, setImageURL] = useState(null);
  const [showPDFSigner, setShowPDFSigner] = useState(false);
  const [showSimplePDFSigner, setShowSimplePDFSigner] = useState(false);
  const [showPDFChoice, setShowPDFChoice] = useState(false);
  const [currentSignerType, setCurrentSignerType] = useState(null);
  const [signerPdfFile, setSignerPdfFile] = useState(null);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    
    // Get display size of canvas in CSS pixels
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.getContext("2d").scale(ratio, ratio);

    // Clear and reinitialize the pad after resize
    signaturePadRef.current?.clear();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: "#ffffff",
      penColor: "#1f2937",
      minWidth: 2,
      maxWidth: 4,
    });
    signaturePadRef.current = signaturePad;

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const clear = () => {
    signaturePadRef.current?.clear();
    setImageURL(null);
  };

  const save = () => {
    if (signaturePadRef.current?.isEmpty()) {
      alert("Please sign before saving.");
      return;
    }
    const dataURL = signaturePadRef.current.toDataURL("image/png", { backgroundColor: 'transparent' });
    setImageURL(dataURL);
  };

  const openPDFSigner = () => {
    if (!imageURL) {
      alert("Please create and save a signature first.");
      return;
    }
    setCurrentSignerType('advanced');
    setShowPDFChoice(true);
  };

  const openSimplePDFSigner = () => {
    if (!imageURL) {
      alert("Please create and save a signature first.");
      return;
    }
    setCurrentSignerType('simple');
    setShowPDFChoice(true);
  };

  const handleUseUploadedPDF = () => {
    if (uploadedFile) {
      setSignerPdfFile(uploadedFile);
    }
    if (currentSignerType === 'simple') {
      setShowSimplePDFSigner(true);
    } else if (currentSignerType === 'advanced') {
      setShowPDFSigner(true);
    }
  };

  const handleChooseNewPDF = () => {
    setSignerPdfFile(null);
    if (currentSignerType === 'simple') {
      setShowSimplePDFSigner(true);
    } else if (currentSignerType === 'advanced') {
      setShowPDFSigner(true);
    }
  };

  return (
    <div className="mt-10 p-6 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-2xl space-y-5">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-700 text-center drop-shadow-sm">
        ✍️ Sign the Agreement
      </h2>

      {/* Canvas wrapper for controlled layout */}
      <div className="w-full max-w-xl mx-auto">
        <canvas
          ref={canvasRef}
          className="w-full h-[250px] border-2 border-dashed border-purple-300 rounded-xl shadow-inner bg-white"
        />
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={clear}
          className="px-6 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md hover:brightness-110 transition"
        >
          Clear
        </button>
        <button
          onClick={save}
          className="px-6 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md hover:brightness-110 transition"
        >
          Save
        </button>
      </div>

      {imageURL && (
        <div className="pt-4 text-center space-y-4">
          <p className="text-sm text-gray-600 mb-2 font-medium">✅ Signature Preview:</p>
          <img
            src={imageURL}
            alt="Saved Signature"
            className="inline-block border-2 border-blue-300 rounded-lg shadow mb-4"
          />
          
          {/* PDF Signing Buttons */}
          <div className="pt-2 space-y-3">
            <div className="flex gap-3 justify-center">
              <button
                onClick={openSimplePDFSigner}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl hover:brightness-110 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <span>📄</span>
                Simple PDF Signer
              </button>
              <button
                onClick={openPDFSigner}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl hover:brightness-110 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <span>🔧</span>
                Advanced PDF Signer
              </button>
            </div>
            <p className="text-xs text-gray-500">Choose Simple for quick signing or Advanced for multi-page support</p>
          </div>
        </div>
      )}
      
      {/* PDF Choice Modal */}
      {showPDFChoice && (
        <PDFSigningChoice
          signature={imageURL}
          onClose={() => setShowPDFChoice(false)}
          hasUploadedPDF={!!uploadedFile}
          uploadedFileName={fileName}
          onUseUploadedPDF={handleUseUploadedPDF}
          onChooseNewPDF={handleChooseNewPDF}
        />
      )}
      
      {/* PDF Signer Modals */}
      {showPDFSigner && (
        <PDFSigner 
          signature={imageURL} 
          onClose={() => setShowPDFSigner(false)}
          preloadedFile={signerPdfFile}
        />
      )}
      
      {showSimplePDFSigner && (
        <SimplePDFSigner 
          signature={imageURL} 
          onClose={() => setShowSimplePDFSigner(false)}
          preloadedFile={signerPdfFile}
        />
      )}
    </div>
  );
}
