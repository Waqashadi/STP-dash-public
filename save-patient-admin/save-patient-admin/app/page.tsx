"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const { isAuthenticated, checking } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!checking) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, checking, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#4B5C55" }}>
      <Loader2 size={24} className="spin" style={{ marginRight: 8 }} />
      Loading application…
    </div>
  );
}