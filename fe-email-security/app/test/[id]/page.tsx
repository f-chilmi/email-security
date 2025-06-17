"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { wsClient } from "@/lib/websocket";
import Navbar from "@/components/Navbar";
import TestRunner from "@/components/TestRunner";
import TestResults from "@/components/TestResults";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/lib/auth";

interface TestSession {
  id: string;
  sessionName: string;
  status: string;
  totalTests: number;
  completedTests: number;
  overallScore?: number;
}

interface TestResult {
  id: string;
  testType: string;
  status: string;
  score?: number;
  recommendations?: string[];
  resultData?: any;
}

export default function TestPage() {
  const { id } = useParams();
  console.log(id);
  const { user } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<TestSession | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestData();

    // Subscribe to real-time updates
    wsClient.subscribe("test_progress", handleTestProgress);
    wsClient.subscribe("test_complete", handleTestComplete);

    return () => {
      wsClient.unsubscribe("test_progress", handleTestProgress);
      wsClient.unsubscribe("test_complete", handleTestComplete);
    };
  }, [id]);

  const loadTestData = async () => {
    try {
      const response = await api.get(`/tests/sessions/${id}/results`);
      setSession(response.data.session);
      setResults(response.data.results);
    } catch (err) {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleTestProgress = (data: any) => {
    if (data.sessionId === id) {
      setSession((prev) => (prev ? { ...prev, ...data } : null));
      setResults(data.results || []);
    }
  };

  const handleTestComplete = (data: any) => {
    if (data.sessionId === id) {
      loadTestData(); // Reload final results
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-300 hover:text-white mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">
            {session.sessionName}
          </h1>
          <p className="text-gray-300">
            Test Status: {session.status} • {session.completedTests}/
            {session.totalTests} completed
          </p>
        </div>

        {session.status === "RUNNING" ? (
          <TestRunner session={session} results={results} />
        ) : (
          <TestResults session={session} results={results} />
        )}
      </div>
    </div>
  );
}
