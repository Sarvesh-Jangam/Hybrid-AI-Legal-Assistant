'use client';
import { useState } from 'react';

const ClauseAnalysisResults = ({ analysisResult, analysisMode }) => {
  const [expandedClauses, setExpandedClauses] = useState({});

  const toggleClauseExpansion = (index) => {
    setExpandedClauses(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getRiskColor = (riskLevel) => {
    if (!riskLevel) return 'bg-gray-100 text-gray-700';
    const risk = riskLevel.toLowerCase();
    if (risk.includes('high')) return 'bg-red-100 text-red-800';
    if (risk.includes('medium')) return 'bg-yellow-100 text-yellow-800';
    if (risk.includes('low')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-700';
  };

  const getRiskIcon = (riskLevel) => {
    if (!riskLevel) return '⚪';
    const risk = riskLevel.toLowerCase();
    if (risk.includes('high')) return '🔴';
    if (risk.includes('medium')) return '🟡';
    if (risk.includes('low')) return '🟢';
    return '⚪';
  };

  if (!analysisResult) return null;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Analysis Results</h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Total Clauses: {analysisResult.total_clauses || 0}
          </span>
        </div>
      </div>

      {/* Summary Card */}
      {analysisResult.summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Executive Summary
          </h3>
          <p className="text-blue-700 leading-relaxed whitespace-pre-line">{analysisResult.summary}</p>
        </div>
      )}

      {/* Single Document Analysis */}
      {(analysisMode === 'extract' || analysisMode === 'text') && analysisResult.clauses && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Extracted Clauses</h3>
          {analysisResult.clauses.map((clause, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div 
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => toggleClauseExpansion(index)}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-lg">{getRiskIcon(clause.risk_level)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-800">{clause.type || 'Unknown Clause'}</h4>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(clause.risk_level)}`}>
                      {clause.risk_level || 'Unknown Risk'}
                    </span>
                  </div>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedClauses[index] ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {expandedClauses[index] && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  {clause.text && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Clause Text:</h5>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded border text-sm leading-relaxed">
                        {clause.text}
                      </p>
                    </div>
                  )}
                  
                  {clause.key_points && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Key Points:</h5>
                      <p className="text-gray-600 text-sm leading-relaxed">{clause.key_points}</p>
                    </div>
                  )}
                  
                  {clause.analysis && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Legal Analysis:</h5>
                      <p className="text-gray-600 text-sm leading-relaxed">{clause.analysis}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Document Comparison */}
      {analysisMode === 'compare' && analysisResult.document1 && analysisResult.document2 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800">Document Comparison</h3>
          
          {/* Document Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-800 mb-3">📄 Document 1</h4>
              <p className="text-blue-700 font-medium mb-2">{analysisResult.document1.filename}</p>
              <p className="text-blue-600 text-sm">Total Clauses: {analysisResult.document1.total_clauses}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-800 mb-3">📄 Document 2</h4>
              <p className="text-green-700 font-medium mb-2">{analysisResult.document2.filename}</p>
              <p className="text-green-600 text-sm">Total Clauses: {analysisResult.document2.total_clauses}</p>
            </div>
          </div>

          {/* Comparison Analysis */}
          {analysisResult.comparison && analysisResult.comparison.comparison_analysis && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Comparative Analysis
              </h4>
              <div className="text-purple-700 leading-relaxed whitespace-pre-line">
                {analysisResult.comparison.comparison_analysis}
              </div>
            </div>
          )}

          {/* Side-by-side clause display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document 1 Clauses */}
            <div>
              <h4 className="font-semibold text-blue-800 mb-4">Clauses in Document 1</h4>
              <div className="space-y-3">
                {analysisResult.document1.clauses && analysisResult.document1.clauses.map((clause, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-blue-800">{clause.type || 'Unknown'}</h5>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(clause.risk_level)}`}>
                        {clause.risk_level || 'N/A'}
                      </span>
                    </div>
                    {clause.text && (
                      <p className="text-blue-700 text-sm line-clamp-3">{clause.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Document 2 Clauses */}
            <div>
              <h4 className="font-semibold text-green-800 mb-4">Clauses in Document 2</h4>
              <div className="space-y-3">
                {analysisResult.document2.clauses && analysisResult.document2.clauses.map((clause, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-green-800">{clause.type || 'Unknown'}</h5>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(clause.risk_level)}`}>
                        {clause.risk_level || 'N/A'}
                      </span>
                    </div>
                    {clause.text && (
                      <p className="text-green-700 text-sm line-clamp-3">{clause.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClauseAnalysisResults;
