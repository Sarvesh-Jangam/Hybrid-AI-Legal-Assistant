'use client';
import { useState } from 'react';

export default function LawyerProfileCard({ lawyer, isOpen, onClose }) {
  if (!isOpen || !lawyer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{lawyer.name}</h2>
              <p className="text-indigo-100 mt-1">{lawyer.specialization || 'General Practice'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {lawyer.email}
              </p>
              {lawyer.phone && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Phone:</span> {lawyer.phone}
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Professional Details</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Bar ID:</span> {lawyer.barId || 'Not provided'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Experience:</span> {lawyer.experience ? `${lawyer.experience} years` : 'Not specified'}
              </p>
            </div>
          </div>

          {/* Specialization & Services */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Specialization & Services</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {lawyer.specialization || 'General Practice'}
              </span>
              {lawyer.experience && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {lawyer.experience} years experience
                </span>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Consultation Rates</h3>
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-green-600">
                ₹{lawyer.feePerHour || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">per hour</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Rates may vary based on consultation type and complexity
            </p>
          </div>

          {/* Verification Status */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Verification Status</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                lawyer.verificationStatus === 'approved' ? 'bg-green-500' :
                lawyer.verificationStatus === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium capitalize">
                {lawyer.verificationStatus || 'Pending'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {lawyer.verificationStatus === 'approved' ? 
                'This lawyer has been verified and is ready to provide consultations.' :
                lawyer.verificationStatus === 'pending' ?
                'This lawyer is currently under review.' :
                'This lawyer\'s profile is under review.'
              }
            </p>
          </div>

          {/* Availability */}
          {lawyer.availabilitySchedule && lawyer.availabilitySchedule.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">Availability</h3>
              <div className="space-y-2">
                {lawyer.availabilitySchedule.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{schedule.day}</span>
                    <span className="text-gray-600">
                      {schedule.startTime} - {schedule.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center pt-4 border-t">
            <button
              onClick={onClose}
              className="bg-gray-500 text-white py-2 px-8 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
