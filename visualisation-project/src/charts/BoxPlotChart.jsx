import ReactECharts from "echarts-for-react";
import { getBoxplotData } from "../data/transformResults";

function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function makeBox(values) {
  if (!values || values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const max = sorted[sorted.length - 1];

  return [min, q1, median, q3, max];
}

export default function BoxPlotChart() {
  const conditions = [
    { label: "Indoor Pre", location: "indoor", stage: "pre" },
    { label: "Indoor Post", location: "indoor", stage: "post" },
    { label: "Outdoor Pre", location: "outdoor", stage: "pre" },
    { label: "Outdoor Post", location: "outdoor", stage: "post" },
  ];

  const trainedBoxes = [];
  const untrainedBoxes = [];

  conditions.forEach((c) => {
    const result = getBoxplotData({
      metric: "cognitive",
      location: c.location,
      stage: c.stage,
    });

    const trainedValues =
      result.find((r) => r.group === "trained")?.values ?? [];
    const untrainedValues =
      result.find((r) => r.group === "untrained")?.values ?? [];

    trainedBoxes.push(makeBox(trainedValues));
    untrainedBoxes.push(makeBox(untrainedValues));
  });

  const option = {
    title: {
      text: "Cognitive Score Distribution by Condition",
      left: "center",
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      top: 40,
    },
    grid: {
      left: 70,
      right: 30,
      top: 90,
      bottom: 100,
    },
    xAxis: {
      type: "category",
      data: conditions.map((c) => c.label),
      axisLabel: {
        rotate: 30,
        interval: 0, // force all labels to show
      },
    },
    yAxis: {
      type: "value",
      name: "Session score",
    },
    series: [
      {
        name: "Trained",
        type: "boxplot",
        data: trainedBoxes,
      },
      {
        name: "Untrained",
        type: "boxplot",
        data: untrainedBoxes,
      },
    ],
  };

  // console.log("Indoor Post trained:", getBoxplotData({ metric: "cognitive", location: "indoor", stage: "post" }));
  // console.log("x-axis categories:", conditions.map((c) => c.label));
  // console.log("trainedBoxes:", trainedBoxes);
  // console.log("untrainedBoxes:", untrainedBoxes);
  return <ReactECharts option={option} style={{ height: 460 }} />;
}