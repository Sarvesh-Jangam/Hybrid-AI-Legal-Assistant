'use client'
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useEffect } from "react";


export default function RolePageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/user/client');
  }, [router]);

  return null;
}
