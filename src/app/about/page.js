import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm shadow-2xl border border-white/20 rounded-3xl p-8 space-y-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 bg-clip-text text-transparent mb-2">
            About AI Legal Assistant
          </h1>
          <p className="text-gray-600 text-lg font-medium mb-4">
            AI Legal Assistant is a state-of-the-art platform designed to assist legal practitioners with document analysis, contract analysis, and legal support using advanced AI technology.
          </p>
          <p className="text-gray-600">
            Our goal is to simplify and enhance the legal document processing experience, allowing you to focus more on critical legal analysis and decision-making.
          </p>
          <p className="text-gray-600">
            This tool provides:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Real-time document analysis</li>
            <li>Intuitive chat interface for legal inquiries</li>
            <li>Secure and efficient document handling</li>
            <li>Advanced AI-driven recommendations</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
