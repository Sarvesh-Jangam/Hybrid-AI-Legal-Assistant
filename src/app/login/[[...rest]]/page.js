"use client";
import { SignedIn, SignedOut, SignIn,useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const {user}=useUser();
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(()=>{
    setSelectedRole(user?.unsafeMetadata.role);
  },[])
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <SignedOut>
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Login to AI Legal Assistant
          </h1>

          {!selectedRole ? (
            <div className="space-y-4 text-center">
              <p className="font-medium text-gray-700">Choose your role:</p>
              <button
                onClick={() => setSelectedRole("client")}
                className="px-4 py-2 w-full bg-blue-500 text-white rounded-xl"
              >
                Login as User
              </button>
              <button
                onClick={() => setSelectedRole("lawyer")}
                className="px-4 py-2 w-full bg-green-500 text-white rounded-xl"
              >
                Login as Lawyer
              </button>
              {/* <button
                onClick={() => setSelectedRole("admin")}
                className="px-4 py-2 w-full bg-red-500 text-white rounded-xl"
              >
                Login as Admin
              </button> */}
            </div>
          ) : (
            <>
              <p className="mb-4 text-gray-600 text-center">
                You are logging in as <b>{selectedRole}</b>
              </p>
              <SignIn
                path="/login"                // must match your route
                routing="path"
                afterSignInUrl={`/user/${selectedRole}`} // redirect after login
              />
            </>
          )}
        </div>
      </SignedOut>

      <SignedIn>
        <div className="text-center">
          <h2 className="text-xl text-black font-semibold mb-4">You are already signed in!</h2>
          <Link href={`/about`} className="text-blue-600 underline">Go to User Page</Link>
          {/* <Link href={`/user/${user?.unsafeMetadata?.role}`} className="text-blue-600 underline">Go to User Page</Link> */}
        </div>
      </SignedIn>
    </main>
  );
}
