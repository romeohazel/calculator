"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setStatus("error");
      return;
    }

    fetch("/api/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        setStatus("ok");
        setTimeout(() => router.replace("/"), 1500);
      })
      .catch(() => setStatus("error"));
  }, [searchParams, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {status === "loading" && <p>Confirming payment…</p>}
      {status === "ok" && (
        <>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>You&apos;re in.</h1>
          <p style={{ color: "#9aa3b2", margin: 0 }}>Redirecting to the calculator…</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Something went wrong</h1>
          <Link href="/" style={{ color: "#6ea8fe" }}>
            Back to calculator
          </Link>
        </>
      )}
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh" }} />}>
      <SuccessContent />
    </Suspense>
  );
}
