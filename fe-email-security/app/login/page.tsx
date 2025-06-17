"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LoginPage() {
  const { login, loading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user && !authLoading) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      // Navigation will happen via useEffect
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <LoadingSpinner />;
  if (user) return <LoadingSpinner />; // Show loading while redirecting

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">
            Email Security Dashboard
          </h1>
          <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}
