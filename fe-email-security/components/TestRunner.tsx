"use client";
import ScoreRing from "./ScoreRing";

interface TestRunnerProps {
  session: any;
  results: any[];
}

export default function TestRunner({ session, results }: TestRunnerProps) {
  const progress = (session.completedTests / session.totalTests) * 100;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Running Tests...</h2>
          <div className="text-white/80">
            {session.completedTests}/{session.totalTests} completed
          </div>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-gray-300 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {["DMARC", "SPF", "DKIM", "MAIL_SERVER"].map((testType) => {
          const result = results.find((r) => r.testType === testType);
          return (
            <div
              key={testType}
              className="bg-gray-800 backdrop-blur-sm rounded-lg p-4"
            >
              <h3 className="text-gray-800 font-medium mb-2">{testType}</h3>
              {result ? (
                <div className="flex items-center space-x-2">
                  <ScoreRing score={result.score || 0} size="sm" />
                  <span className="text-gray-300 text-sm">
                    {result.status === "COMPLETED" ? "Complete" : result.status}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin"></div>
                  <span className="text-gray-400 text-sm">Testing...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
