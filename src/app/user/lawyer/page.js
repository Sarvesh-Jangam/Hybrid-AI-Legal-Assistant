'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import ConsultationChat from "@/app/components/ConsultationChat";

export default function LawyerDashboard() {
  const [profile, setProfile] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    specialization: "",
    barId: "",
    experience: "",
    feePerHour: "",
    connection_link: "",
    availabilitySchedule: [],
  });
  const [activeConsultation, setActiveConsultation] = useState(null);

  const { userId, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { user } = useUser();

  // Assign role lawyer if not set
  useEffect(() => {
    (async () => {
      if (user && isLoaded && !user?.role) {
        await user?.update({ unsafeMetadata: { role: "lawyer" } });
      }
    })();
  }, [user, isLoaded]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch profile + consultations
  useEffect(() => {
    if (!isLoaded || !userId) return;
    (async () => {
      try {
        const res = await axios.get(`/api/lawyer/${userId}`);
        const lawyerId=res.data.profile._id;
        setProfile(res.data.profile);
        // Filter consultations for this lawyer
        const consultations=await axios.get(`/api/consultations?userId=${user.id}`);
        const myConsultations = (consultations.data.consultations || []).filter(c => c?.lawyer?._id === lawyerId);
        setConsultations(myConsultations);
      } catch (error) {
        console.error("Error fetching lawyer profile:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, userId]);

  // Save profile (onboarding)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        userId,
        name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress,
        specialization: formData.specialization,
        barId: formData.barId,
        experience: formData.experience,
        feePerHour: formData.feePerHour,
        connection_link: formData.connection_link,
        availabilitySchedule: formData.availabilitySchedule || [],
      };
      const res = await axios.post(`/api/lawyer/${userId}`, payload);
      setProfile(res.data.profile);
      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving lawyer profile:", error);
    }
  };

  // Confirm a pending consultation
  const handleConfirm = async (consultationId) => {
    try {
      const res = await axios.patch(`/api/consultations/${consultationId}/confirm`);
      setConsultations(prev =>
        prev.map(c => (c._id === consultationId ? { ...c, status: 'booked' } : c))
      );
      alert('Consultation confirmed!');
    } catch (err) {
      console.error('Error confirming consultation:', err);
      alert('Failed to confirm consultation.');
    }
  };

  // Open chat modal
  const openChat = (consultation) => setActiveConsultation(consultation);
  const closeChat = () => setActiveConsultation(null);

  if (!isLoaded) return <p>Checking authentication...</p>;
  if (!isSignedIn) return null; // Will redirect
  if (loading) return <p>Loading dashboard...</p>;

  // Onboarding form
  if (!profile) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Complete Your Lawyer Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Specialization"
            value={formData.specialization}
            onChange={(e) =>
              setFormData({ ...formData, specialization: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Bar ID"
            value={formData.barId}
            onChange={(e) =>
              setFormData({ ...formData, barId: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Connection Link"
            value={formData.connection_link}
            onChange={(e) =>
              setFormData({ ...formData, connection_link: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Years of Experience"
            value={formData.experience}
            onChange={(e) =>
              setFormData({ ...formData, experience: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Fee per Hour (₹)"
            value={formData.feePerHour}
            onChange={(e) =>
              setFormData({ ...formData, feePerHour: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Save Profile
          </button>
        </form>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="text-black min-h-screen bg-gradient-to-br from-purple-50 via-blue-100 to-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-purple-700 mb-6 flex items-center">
          👨‍⚖️ Lawyer Dashboard
        </h1>

        {/* Profile Card */}
        <div className="p-6 bg-white shadow-lg rounded-2xl border mb-8">
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Specialization:</strong> {profile.specialization}</p>
          <p><strong>Fee:</strong> ₹{profile.feePerHour}/hr</p>
          <p><strong>Status:</strong> {profile.verificationStatus}</p>
          <p><strong>Link:</strong> {profile.connection_link}</p>
        </div>

        {/* Pending Consultations */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Pending Consultations</h2>
        {consultations.filter(c => c.status === 'pending').length === 0 ? (
          <p className="text-gray-600 mb-4">No pending consultations.</p>
        ) : (
          <ul className="space-y-4 mb-6">
            {consultations.filter(c => c.status === 'pending').map((c) => (
              <li key={c._id} className="p-4 bg-gradient-to-r from-yellow-100 via-white to-yellow-200 rounded-xl shadow-md flex justify-between items-start">
                <div>
                  <p className="font-medium">Client: {c?.client?.name}</p>
                  <p className="text-sm text-gray-600">Email: {c?.client?.email}</p>
                  <p className="text-sm text-gray-600">Mode: {c?.mode}</p>
                  <button
                    onClick={() => handleConfirm(c._id)}
                    className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    ✅ Confirm Booking
                  </button>
                </div>
                <span className="text-xs text-gray-500">{new Date(c.dateTime).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Confirmed Consultations */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Confirmed Consultations</h2>
        {consultations.filter(c => c.status === 'booked').length === 0 ? (
          <p className="text-gray-600 mb-4">No confirmed consultations yet.</p>
        ) : (
          <ul className="space-y-4">
            {consultations.filter(c => c.status === 'booked').map((c) => (
              <li key={c._id} className="p-4 bg-gradient-to-r from-violet-100 via-white to-blue-100 rounded-xl shadow-md flex justify-between items-start">
                <div>
                  <p className="font-medium">Client: {c?.client?.name}</p>
                  <p className="text-sm text-gray-600">Email: {c?.client?.email}</p>
                  <p className="text-sm text-gray-600">Mode: {c?.mode}</p>
                  <button
                    onClick={() => openChat(c)}
                    className="mt-2 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    💬 Open Chat
                  </button>
                  <span>    </span>
                  {c.meetingLink && (
                    <a href={c.meetingLink} target="_blank"
                       className="inline-block mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 transition">
                      🎥 Start Video Call
                    </a>
                  )}
                </div>
                <span className="text-xs text-gray-500">{new Date(c.dateTime).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat Modal */}
      {activeConsultation && (
        <ConsultationChat
          consultation={activeConsultation}
          userId={userId} // lawyer's userId
          onClose={closeChat}
          userRole="lawyer"
        />
      )}
    </div>
  );
}
