"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, checking } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state check is complete and user is not logged in, redirect them
    if (!checking && !isAuthenticated) {
      // Passes the current path as a callback URL to redirect back after a successful login
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/dashboard";
      router.replace(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [checking, isAuthenticated, router]);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#4B5C55" }}>
        <Loader2 size={18} className="spin" style={{ marginRight: 8 }} />
        Checking session…
      </div>
    );
  }

  // If not authenticated, return null while the useEffect handles the redirect trigger
  if (!isAuthenticated) return null;

  return <>{children}</>;
}