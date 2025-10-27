'use client';

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm shadow-2xl border border-white/20 rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            📝 Digital Signature Pad
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold bg-white/80 rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            ×
          </button>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-inner border border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}
