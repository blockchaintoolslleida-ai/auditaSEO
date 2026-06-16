"use client";

import {
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface RadarChartProps {
  scores: {
    ranking: number;
    technical: number;
    content: number;
    backlinks: number;
  };
}

export default function ScoreRadarChart({ scores }: RadarChartProps) {
  const data = [
    { category: "Ranking", score: scores.ranking, fullMark: 100 },
    { category: "Técnico", score: scores.technical, fullMark: 100 },
    { category: "Contenido", score: scores.content, fullMark: 100 },
    { category: "Backlinks", score: scores.backlinks, fullMark: 100 },
  ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#9ca3af", fontSize: 10 }}
          />
          <Radar
            name="Puntuación"
            dataKey="score"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
