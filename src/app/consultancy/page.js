'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import LawyerProfileCard from '../components/LawyerProfileCard';
import ConsultationChat from '../components/ConsultationChat'
import axios from 'axios';

export default function ConsultancyPage() {
  const { userId, isLoaded } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({ lawyerUserId: '', dateTime: '', mode: 'chat' });
  const [showProfile, setShowProfile] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [confirmedLawyer, setConfirmedLawyer] = useState(null);
  const currentSelectedLawyer = lawyers.find((l) => l.userId === form.lawyerUserId);

  const [activeConsultation, setActiveConsultation] = useState(null);

  const openChat = (consultation) => {
    setActiveConsultation(consultation);
  };

  const closeChat = () => {
    setActiveConsultation(null);
  };


  useEffect(() => {
    if (!isLoaded || !userId) return;
    (async () => {
      try {
        const [cRes, lRes] = await Promise.all([
          fetch(`/api/consultations?userId=${userId}`),
          fetch(`/api/lawyers`),
        ]);
        const cData = await cRes.json();
        const lData = await lRes.json();
        setConsultations(cData.consultations || []);
        setLawyers((lData.lawyers || []).filter(l => l.verificationStatus !== 'rejected'));
      } catch (e) {
        console.error('Failed loading consultancy data', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, userId]);

  const handleLawyerConfirm = (lawyer) => {
    setConfirmedLawyer(lawyer);
    setForm(prev => ({ ...prev, lawyerUserId: lawyer.userId }));
    setShowProfile(false);
    setSelectedLawyer(null);
  };

  const bookConsultation = async (e) => {
    e.preventDefault();
    if (!form.lawyerUserId || !form.dateTime) return;
    setBooking(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          lawyerUserId: form.lawyerUserId,
          dateTime: form.dateTime,
          mode: form.mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book');
      setConsultations((prev) => [data.consultation, ...prev]);
      setForm({ lawyerUserId: '', dateTime: '', mode: 'chat' });
      setConfirmedLawyer(null);
    } catch (e) {
      console.error('Booking failed', e);
      alert(e.message);
    } finally {
      setBooking(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="p-6 min-w-full mx-auto bg-gray-50 min-h-screen text-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
        <Link href="/" className="text-indigo-600 hover:underline">Back to Home</Link>
      </div>

      {/* Book New Consultation */}
      <div className="bg-white rounded-xl shadow p-4 mb-8 border border-gray-200">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Book a new consultation</h2>
        <form onSubmit={bookConsultation} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="border rounded p-2 bg-white text-gray-900"
            value={form.lawyerUserId}
            onChange={(e) => setForm({ ...form, lawyerUserId: e.target.value })}
            required
          >
            <option value="">Select Lawyer</option>
            {lawyers.map((l) => (
              <option key={l.userId} value={l.userId}>
                {l.name} — {l.specialization || 'General'} ({l.feePerHour ? `₹${l.feePerHour}/hr` : 'Rate N/A'})
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            className="border rounded p-2 bg-white text-gray-900"
            value={form.dateTime}
            onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
            required
          />
          <select
            className="border rounded p-2 bg-white text-gray-900"
            value={form.mode}
            onChange={(e) => setForm({ ...form, mode: e.target.value })}
          >
            <option value="chat">Chat</option>
            <option value="video">Video</option>
          </select>
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded p-2 disabled:opacity-50"
            disabled={booking}
          >
            {booking ? 'Booking…' : 'Book Consultation'}
          </button>
        </form>

        {confirmedLawyer && (
          <div className="mt-4 p-4 border rounded-lg bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-green-800">✓ Selected: {confirmedLawyer.name}</p>
                <p className="text-sm text-green-700">{confirmedLawyer.specialization || 'General Practice'}</p>
                <p className="text-sm text-green-700">{confirmedLawyer.feePerHour ? `₹${confirmedLawyer.feePerHour}/hr` : 'Rate N/A'}</p>
                <p className="text-xs text-green-600">Status: {confirmedLawyer.verificationStatus || 'pending'}</p>
              </div>
              <button 
                onClick={() => {
                  setConfirmedLawyer(null);
                  setForm(prev => ({ ...prev, lawyerUserId: '' }));
                }}
                className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Change Lawyer
              </button>
            </div>
          </div>
        )}

        {!confirmedLawyer && currentSelectedLawyer && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-800">{currentSelectedLawyer.name}</p>
                <p className="text-sm text-gray-600">{currentSelectedLawyer.specialization || 'General Practice'}</p>
                <p className="text-sm text-gray-600">{currentSelectedLawyer.feePerHour ? `₹${currentSelectedLawyer.feePerHour}/hr` : 'Rate N/A'}</p>
                <p className="text-xs text-gray-500">Status: {currentSelectedLawyer.verificationStatus || 'pending'}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedLawyer(currentSelectedLawyer);
                  setShowProfile(true);
                }}
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                View Profile
              </button>
            </div>
          </div>
        )}

        {!confirmedLawyer && !currentSelectedLawyer && (
          <div className="mt-4 p-4 border rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-2">Select a lawyer to view their profile and confirm your choice</p>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-blue-700">Choose a lawyer from the dropdown above to get started</span>
            </div>
          </div>
        )}
      </div>

      {/* Previous Consultations */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">My previous consultations</h2>
        {loading ? (
          <p>Loading…</p>
        ) : consultations.length === 0 ? (
          <p className="text-gray-700">No consultations yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {consultations.map((c) => (
              <li key={c._id} className="py-3 flex items-center justify-between">
                <div>
                  <div>
                    <span className="font-medium text-gray-800">{c.lawyer?.name || 'Lawyer name unknown'}</span>
                    <span>    </span>
                    <span className="text-sm text-gray-500">({c.lawyer?.specialization || 'General'} lawyer)</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(c.dateTime).toLocaleString()} • {c.mode} • {c.status}
                  </p>
                  {c.status=="booked" && (
                  <>
                      {c.meetingLink && (
                        <div className="mt-2">
                          <a 
                            href={c.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            🎥 Join Video Call
                          </a>
                        </div>
                        )}
                        <div className="flex space-x-2">
                          <button
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            onClick={() => openChat(c)}
                          >
                            💬 Chat
                          </button>
                        </div>
                    </>
                  )} 
                    {c.status === 'pending' && (
                      <p className="text-sm text-yellow-600 mt-1">Waiting for lawyer confirmation</p>
                    )}
                </div>
                <div className="text-sm text-gray-500">
                  {c.lawyerId?.specialization || 'General'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {activeConsultation && (
        <ConsultationChat 
          consultation={activeConsultation}
          userId={userId}
          onClose={closeChat}
          userRole="client"
        />
      )};


      {/* Lawyer Profile Modal */}
      <LawyerProfileCard 
        lawyer={selectedLawyer}
        isOpen={showProfile}
        onClose={() => {
          setShowProfile(false);
          setSelectedLawyer(null);
        }}
        onConfirm={handleLawyerConfirm}
      />
    </div>
  );
}
