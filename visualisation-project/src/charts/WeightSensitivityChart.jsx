import ReactECharts from "echarts-for-react";
import { getWeightSensitivity } from "../data/transformResults";

export default function WeightSensitivityChart() {
  const raw = getWeightSensitivity({
    metric: "cognitive",
    location: "indoor",
    stage: "post",
    group: "trained",
  }).filter((d) => d.value !== null && d.x !== undefined && d.y !== undefined);

  const xValues = [...new Set(raw.map((d) => d.x))].sort((a, b) => a - b);
  const yValues = [...new Set(raw.map((d) => d.y))].sort((a, b) => a - b);

  const heatmapData = raw.map((d) => [
    xValues.indexOf(d.x), // x
    yValues.indexOf(d.y), // y
    d.value,              // value for colour
    d.nPairs,
    d.x,
    d.y,
  ]);

  const valuesOnly = raw.map((d) => d.value);
  const minValue = Math.min(...valuesOnly);
  const maxValue = Math.max(...valuesOnly);

  const option = {
    title: {
      text: "Weight Sensitivity Heatmap",
      subtext: "Cognitive · Indoor · Post · Trained",
      left: "center",
    },
    tooltip: {
      position: "top",
      formatter: (params) => {
        const [, , value, nPairs, xWeight, yWeight] = params.value;
        return [
          `Mean score: ${value.toFixed(3)}`,
          `Non-play weight: ${xWeight}`,
          `Stereotype weight: ${yWeight}`,
          `Pairs: ${nPairs}`,
        ].join("<br/>");
      },
    },
    grid: {
      left: 90,
      right: 30,
      top: 100,
      bottom: 110,
    },
    xAxis: {
      type: "category",
      name: "Non-play weight",
      data: xValues.map(String),
    },
    yAxis: {
      type: "category",
      name: "Stereotype weight",
      data: yValues.map(String),
    },
    visualMap: {
      min: minValue,
      max: maxValue,
      calculable: true,
      dimension: 2, 
      orient: "horizontal",
      left: "center",
      bottom: 20,
      formatter: (value) => value.toFixed(2),
      precision: 2,
      inRange: {
        color: ["#E6ECFC", "#8096DC", "#142864"],
      },
    },
    series: [
      {
        name: "Mean score",
        type: "heatmap",
        data: heatmapData,
        encode: {
          x: 0,
          y: 1,
          value: 2,
        },
        label: {
          show: true,
          formatter: ({ value }) => value[2].toFixed(2),
          color: "#222",
        },
        itemStyle: {
          borderColor: "#d0d7e6",
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.25)",
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 520 }} />;
}