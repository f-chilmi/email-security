"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface TestResult {
  testType: string;
  score: number;
  status: string;
}

interface LatestTest {
  overallScore: number;
  status: string;
  lastTestDate: string;
  tests: TestResult[];
}

interface Domain {
  id: string;
  domainName: string;
  createdAt: string;
  latestTest?: LatestTest | null;
}

interface DomainCardProps {
  domain: Domain;
}

export default function DomainCard({ domain }: DomainCardProps) {
  const [testing, setTesting] = useState(false);
  const router = useRouter();

  const runTest = async () => {
    setTesting(true);
    try {
      const response = await api.post("/tests/run", {
        domainName: domain.domainName,
      });
      router.push(`/test/${response.data.sessionId}`);
    } catch (err) {
      console.error("Failed to start test:", err);
      setTesting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-400";
    if (score >= 60) return "bg-yellow-400";
    return "bg-red-400";
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 hover:shadow-2xl transition-all flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {domain.domainName}
          </h3>
          <p className="text-sm text-gray-400">
            Added {new Date(domain.createdAt).toLocaleDateString()}
          </p>
        </div>
        {domain.latestTest ? (
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${getOverallScoreColor(
                domain.latestTest.overallScore
              )}`}
            ></div>
            <span
              className={`text-sm font-medium ${getScoreColor(
                domain.latestTest.overallScore
              )}`}
            >
              {domain.latestTest.overallScore}/100
            </span>
          </div>
        ) : (
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
        )}
      </div>

      <div className="space-y-2 mb-6 ">
        {domain.latestTest ? (
          <>
            {["DMARC", "SPF", "DKIM", "MAIL_SERVER"].map((testType) => {
              const test = domain.latestTest!.tests.find(
                (t) => t.testType === testType
              );
              return (
                <div key={testType} className="flex justify-between text-sm">
                  <span className="text-gray-300">{testType}</span>
                  {test ? (
                    <span className={getScoreColor(test.score)}>
                      {test.score}/100
                    </span>
                  ) : (
                    <span className="text-gray-500">Not tested</span>
                  )}
                </div>
              );
            })}
            <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
              <span>Last tested:</span>
              <span>
                {new Date(domain.latestTest.lastTestDate).toLocaleDateString()}
              </span>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-4">
            No tests performed yet
          </div>
        )}
      </div>

      <button
        onClick={runTest}
        disabled={testing}
        className="mt-auto w-full bg-gray-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
      >
        {testing
          ? "Starting Test..."
          : domain.latestTest
          ? "Run New Test"
          : "Run Security Test"}
      </button>
    </div>
  );
}
