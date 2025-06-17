interface ScoreRingProps {
  score: number;
  size?: "sm" | "lg";
}

export default function ScoreRing({ score, size = "sm" }: ScoreRingProps) {
  const radius = size === "lg" ? 40 : 20;
  const strokeWidth = size === "lg" ? 6 : 3;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return "#10B981"; // green
    if (score >= 60) return "#F59E0B"; // yellow
    return "#EF4444"; // red
  };

  const containerSize = size === "lg" ? "w-24 h-24" : "w-12 h-12";
  const textSize = size === "lg" ? "text-lg" : "text-xs";

  return (
    <div
      className={`relative ${containerSize} flex items-center justify-center`}
    >
      <svg
        className="transform -rotate-90"
        width={radius * 2}
        height={radius * 2}
      >
        <circle
          stroke="rgba(255,255,255,0.2)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getColor(score)}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center ${textSize} font-bold text-gray-300`}
      >
        {score}
      </div>
    </div>
  );
}
