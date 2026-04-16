import ReactECharts from "echarts-for-react";
import { getSessionSeries } from "../data/transformResults";

function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((s, [x]) => s + x, 0);
  const sumY = points.reduce((s, [, y]) => s + y, 0);
  const sumXY = points.reduce((s, [x, y]) => s + x * y, 0);
  const sumX2 = points.reduce((s, [x]) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const xs = points.map(([x]) => x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return [
    [minX, slope * minX + intercept],
    [maxX, slope * maxX + intercept],
  ];
}

export default function SessionScatterChart() {
  const data = getSessionSeries({
    child: "albert",
    location: "indoor",
    stage: "pre",
    metric: "cognitive",
  });

  const trainedPoints = data
    .filter((d) => d.trained !== null)
    .map((d) => [d.session, d.trained]);

  const untrainedPoints = data
    .filter((d) => d.untrained !== null)
    .map((d) => [d.session, d.untrained]);

  const trainedTrend = linearRegression(trainedPoints);
  const untrainedTrend = linearRegression(untrainedPoints);

  const option = {
    title: {
      text: "Albert Indoor Pre Cognitive Session Scores",
      left: "center",
      padding: [5, 0, 50, 0],
    },
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        if (params.seriesType === "line") return null;
        const [session, value] = params.value;
        return `${params.seriesName}<br/>Session: ${session}<br/>Score: ${value.toFixed(3)}`;
      },
    },
    legend: {
      top: 40,
      data: ["Trained", "Untrained"],
    },
    grid: {
      left: 70,
      right: 30,
      top: 90,
      bottom: 60,
    },
    xAxis: {
      type: "value",
      name: "Session",
      minInterval: 1,
    },
    yAxis: {
      type: "value",
      name: "Session score",
    },
    series: [
      {
        name: "Trained",
        type: "scatter",
        symbolSize: 12,
        data: trainedPoints,
      },
      {
        name: "Untrained",
        type: "scatter",
        symbolSize: 12,
        data: untrainedPoints,
      },
      {
        name: "Trained Trend",
        type: "line",
        data: trainedTrend,
        showSymbol: false,
        color: "#5470c6",           // match Trained scatter color
        lineStyle: { type: "dashed", width: 2, opacity: 0.6 },
        tooltip: { show: false },
        legendHoverLink: false,
        silent: true,
      },
      {
        name: "Untrained Trend",
        type: "line",
        data: untrainedTrend,
        showSymbol: false,
        color: "#91cc75",           // match Untrained scatter color
        lineStyle: { type: "dashed", width: 2, opacity: 0.6 },
        tooltip: { show: false },
        legendHoverLink: false,
        silent: true,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 460 }} />;
}