"use client";

import { useState } from "react";

export default function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [paper, setPaper] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔁 SIMPLE + SAFE FETCH (no abort issues)
  const fetchWithRetry = async (formData, retries = 1) => {
    try {
      console.log("🚀 Sending request...");

      const res = await fetch("http://127.0.0.1:8000/generate-research-paper", {
        method: "POST",
        body: formData,
      });

      console.log("📡 Response received:", res);

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      console.log("✅ Data:", data);

      return data;

    } catch (err) {
      console.log("❌ Error:", err);

      if (retries > 0) {
        console.log("🔁 Retrying in 2s...");
        await new Promise((r) => setTimeout(r, 2000));
        return fetchWithRetry(formData, retries - 1);
      }

      throw err;
    }
  };

  // 🚀 Generate Paper
  const generatePaper = async () => {
    if (!topic) return alert("Please enter a topic");
    if (loading) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("topic", topic);
    formData.append("context", context);

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-research-paper", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setPaper(data.paper);

    } catch (err) {
      alert(err.message || "⚠️ Error generating paper.");
    } finally {
      setLoading(false);
    }
  };

  // 🖨️ Print
  const handlePrint = () => {
    const content = document.getElementById("paper-content").innerHTML;

    const win = window.open("", "", "width=900,height=700");
    win.document.write(`
      <html>
        <head>
          <title>Research Paper</title>
          <style>
            body {
              font-family: "Times New Roman", serif;
              padding: 40px;
              line-height: 1.6;
              background: white;
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  // 📄 Download PDF
  const downloadPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("paper-content");

    html2pdf()
      .from(element)
      .set({
        margin: 10,
        filename: "research-paper.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { format: "a4", orientation: "portrait" },
      })
      .save();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 text-black">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8">
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          IEEE Research Paper Generator
        </h1>

        {/* Topic Input */}
        <input
          type="text"
          placeholder="Enter topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Context */}
        <textarea
          placeholder="Optional context..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={4}
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Generate Button */}
        <button
          onClick={generatePaper}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Paper"}
        </button>

        {/* Loading */}
        {loading && (
          <p className="text-center mt-4 text-gray-500">
            Generating paper... this may take up to 1 minute
          </p>
        )}

        {/* Output */}
        {paper && (
          <>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePrint}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg"
              >
                Print
              </button>

              <button
                onClick={downloadPDF}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Download PDF
              </button>
            </div>

            <div
              id="paper-content"
              className="mt-8 p-8 bg-white border rounded-lg shadow-sm font-serif whitespace-pre-wrap leading-relaxed text-gray-900"
              style={{ fontFamily: "Times New Roman" }}
            >
              {paper}
            </div>
          </>
        )}
      </div>
    </div>
  );
}