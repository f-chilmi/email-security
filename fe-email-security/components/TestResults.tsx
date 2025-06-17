"use client";
import ScoreRing from "./ScoreRing";

interface TestResultsProps {
  session: any;
  results: any[];
}

export default function TestResults({ session, results }: TestResultsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-400";
      case "FAILED":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-gray-800 backdrop-blur-sm rounded-lg p-6 text-center flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-white mb-4">
          Overall Security Score
        </h2>
        <ScoreRing score={session.overallScore || 0} size="lg" />
        <p className="text-gray-300 mt-4">
          {session.overallScore >= 80
            ? "Excellent security configuration"
            : session.overallScore >= 60
            ? "Good security, some improvements needed"
            : "Poor security, immediate action required"}
        </p>
      </div>

      {/* Individual Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {results.map((result) => (
          <div
            key={result.id}
            className="bg-gray-800 backdrop-blur-sm rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {result.testType}
              </h3>
              <div className="flex items-center space-x-3">
                <ScoreRing score={result.score || 0} size="sm" />
                <span
                  className={`text-sm font-medium ${getStatusColor(
                    result.status
                  )}`}
                >
                  {result.status}
                </span>
              </div>
            </div>

            {result.status === "FAILED" && result.errorMessage && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm">{result.errorMessage}</p>
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium text-sm">
                  Recommendations:
                </h4>
                <ul className="space-y-1">
                  {result.recommendations.map((rec: string, index: number) => (
                    <li
                      key={index}
                      className="text-white/80 text-sm flex items-start"
                    >
                      <span className="text-[#A9CEF4] mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.resultData && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="text-white font-medium text-sm mb-2">
                  Details:
                </h4>
                <div className="text-white/70 text-xs space-y-1">
                  {result.testType === "DMARC" && result.resultData.policy && (
                    <div>Policy: {result.resultData.policy}</div>
                  )}
                  {result.testType === "SPF" && result.resultData.record && (
                    <div className="break-all">
                      Record: {result.resultData.record}
                    </div>
                  )}
                  {result.testType === "MAIL_SERVER" &&
                    result.resultData.mxRecords && (
                      <div>
                        MX Records: {result.resultData.mxRecords.join(", ")}
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Retry Button for Failed Tests */}
      {results.some((r) => r.status === "FAILED") && (
        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
          >
            Retry Failed Tests
          </button>
        </div>
      )}
    </div>
  );
}
