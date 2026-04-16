import ReactECharts from "echarts-for-react";
import { summariseByCondition } from "../data/transformResults";

export default function ScoreBarChart() {
  const data = summariseByCondition("cognitive");

  const labels = data.map((d) => d.label);
  const trained = data.map((d) => d.trained);
  const untrained = data.map((d) => d.untrained);

  const option = {
    title: {
      text: "Cognitive Mean Scores by Condition",
      left: "center",
      padding: [5, 0, 50, 0],
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: {
      top: 40,
    },
    grid: {
      left: 70,
      right: 30,
      top: 90,
      bottom: 0,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        rotate: 30,
        interval: 0,
      },
},
    yAxis: {
      type: "value",
      name: "Mean score",
    },
    series: [
      {
        name: "Trained",
        type: "bar",
        data: trained,
      },
      {
        name: "Untrained",
        type: "bar",
        data: untrained,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 460 }} />;
}