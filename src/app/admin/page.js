'use client'
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setLawyers(data.lawyers);
        setClients(data.clients);
      }
    })();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">⚖️ Admin Dashboard</h1>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Lawyers</h2>
        <ul className="space-y-2 mt-3">
          {lawyers.map(lawyer => (
            <li key={lawyer._id} className="p-3 bg-gray-100 rounded flex justify-between">
              <span>{lawyer.name} - {lawyer.specialization}</span>
              <span className={`px-2 py-1 rounded ${lawyer.verificationStatus === "approved" ? "bg-green-200" : "bg-yellow-200"}`}>
                {lawyer.verificationStatus}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Clients</h2>
        <ul className="space-y-2 mt-3">
          {clients.map(client => (
            <li key={client._id} className="p-3 bg-gray-100 rounded">
              {client.name} - {client.subscriptionType}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
