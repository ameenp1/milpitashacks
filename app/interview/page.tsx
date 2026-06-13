"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The guided interview is now part of the unified chat.
export default function InterviewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/chat");
  }, [router]);
  return null;
}
