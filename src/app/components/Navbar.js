'use client';
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { signOut } = useClerk();
  const pathname = usePathname();

  return (
    <nav className="w-full bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-100 backdrop-blur-sm shadow-xl border-b border-indigo-200/30 px-8 py-5 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9m3 9l3-9" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 bg-clip-text text-transparent">
            AI Legal Assistant
          </h1>
          <p className="text-sm text-gray-600 font-medium">Professional Legal Analysis</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Link 
          href="/" 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 transform ${
            pathname === '/' 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Home</span>
        </Link>
        <Link 
          href="/legal-documents" 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 transform ${
            pathname === '/legal-documents' 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Legal Docs</span>
        </Link>
        <Link 
          href="/clause-analysis" 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 transform ${
            pathname === '/clause-analysis' 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <span>Clause Analysis</span>
        </Link>
        <Link 
          href="/consultancy" 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 transform ${
            pathname === '/consultancy' 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 4h.01" />
          </svg>
          <span>Consultancy</span>
        </Link>
        <Link 
          href="/about" 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 transform ${
            pathname === '/about' 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>About</span>
        </Link>
        <button
          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ml-4"
          onClick={() => signOut(() => router.replace("/login"))}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
