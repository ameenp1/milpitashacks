"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Per-form filling now happens in the unified chat (with the form on the right).
export default function FormRedirect() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/chat?form=${params.formId}`);
  }, [router, params.formId]);
  return null;
}
