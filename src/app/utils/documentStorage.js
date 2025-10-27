// Utility functions for document storage

/**
 * Convert File to Base64 string for storage
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 encoded string
 */
export const fileToBase64 = async (file) => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.FileReader) {
    // Browser environment - use FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  } else {
    // Node.js environment - use Buffer
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer.toString('base64');
    } catch (error) {
      throw new Error(`Failed to convert file to base64: ${error.message}`);
    }
  }
};

/**
 * Convert Base64 string back to File
 * @param {string} base64Data - Base64 encoded string
 * @param {string} fileName - Name for the file
 * @param {string} mimeType - MIME type of the file
 * @returns {File|Buffer} Reconstructed file (File in browser, Buffer in Node.js)
 */
export const base64ToFile = (base64Data, fileName, mimeType) => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.Blob && window.File) {
    // Browser environment - use Blob and File APIs
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    return new File([blob], fileName, { type: mimeType });
  } else {
    // Node.js environment - return Buffer
    return Buffer.from(base64Data, 'base64');
  }
};

/**
 * Check if document storage is feasible (size limits, etc.)
 * @param {File} file - File to check
 * @returns {Object} Validation result
 */
export const validateDocumentForStorage = (file) => {
  const MAX_SIZE = 16 * 1024 * 1024; // 16MB limit for MongoDB document
  const ALLOWED_TYPES = ['application/pdf'];
  
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (file.size > MAX_SIZE) {
    return { 
      valid: false, 
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (16MB)` 
    };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type ${file.type} not allowed. Only PDF files are supported.` 
    };
  }
  
  return { valid: true };
};

/**
 * Prepare document data for storage
 * @param {File} file - File to prepare
 * @returns {Promise<Object>} Document data object
 */
export const prepareDocumentForStorage = async (file) => {
  const validation = validateDocumentForStorage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  try {
    const base64Data = await fileToBase64(file);
    
    return {
      hasDocument: true,
      documentData: base64Data,
      documentSize: file.size,
      documentType: file.type,
      fileName: file.name
    };
  } catch (error) {
    throw new Error(`Failed to process document: ${error.message}`);
  }
};
