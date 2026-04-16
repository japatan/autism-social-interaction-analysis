import rawResults from "./results_full.json";

// New JSON shape:
// {
//   metadata: ...,
//   pairs: [...],
//   rows: [...],
//   summaries: [...],
//   changes: [...],
//   weight_sensitivity: ...
// }

const rows = rawResults.rows ?? [];
const summaries = rawResults.summaries ?? [];
const changes = rawResults.changes ?? [];
const pairs = rawResults.pairs ?? [];
const weightSensitivity = rawResults.weight_sensitivity ?? {};

console.log("results metadata:", rawResults.metadata);
console.log("rows:", rows.length);
console.log("summaries:", summaries.length);
console.log("changes:", changes.length);
console.log("pairs:", pairs.length);

export function summariseByCondition(targetMetric = "cognitive") {
  const order = [
    ["indoor", "pre"],
    ["indoor", "post"],
    ["outdoor", "pre"],
    ["outdoor", "post"],
  ];

  return order.map(([location, stage]) => {
    const trained = summaries.find(
      (d) =>
        d.metric === targetMetric &&
        d.location === location &&
        d.stage === stage &&
        d.group === "trained"
    );

    const untrained = summaries.find(
      (d) =>
        d.metric === targetMetric &&
        d.location === location &&
        d.stage === stage &&
        d.group === "untrained"
    );

    return {
      key: `${location}-${stage}`,
      label: `${capitalize(location)} ${capitalize(stage)}`,
      location,
      stage,
      trained: trained?.mean_of_pair_means ?? null,
      trainedSem: trained?.sem_of_pair_means ?? null,
      trainedCI95: trained?.ci95_of_pair_means ?? null,
      trainedPairs: trained?.n_pairs ?? 0,
      untrained: untrained?.mean_of_pair_means ?? null,
      untrainedSem: untrained?.sem_of_pair_means ?? null,
      untrainedCI95: untrained?.ci95_of_pair_means ?? null,
      untrainedPairs: untrained?.n_pairs ?? 0,
    };
  });
}

export function getSessionSeries({
  child = "albert",
  location = "indoor",
  stage = "pre",
  metric = "cognitive",
}) {
  const childRows = rows.filter((r) => r.child === child);

  const trainedRow = childRows.find(
    (r) =>
      r.group === "trained" &&
      r.metric === metric &&
      r.location === location &&
      r.stage === stage
  );

  const untrainedRow = childRows.find(
    (r) =>
      r.group === "untrained" &&
      r.metric === metric &&
      r.location === location &&
      r.stage === stage
  );

  const trainedSessions = (trainedRow?.sessions ?? []).map(Number);
  const untrainedSessions = (untrainedRow?.sessions ?? []).map(Number);

  const maxLen = Math.max(trainedSessions.length, untrainedSessions.length);

  return Array.from({ length: maxLen }, (_, i) => ({
    session: i + 1,
    trained: Number.isFinite(trainedSessions[i]) ? trainedSessions[i] : null,
    untrained: Number.isFinite(untrainedSessions[i]) ? untrainedSessions[i] : null,
  }));
}

export function getBoxplotData({
  metric = "cognitive",
  location = "indoor",
  stage = "pre",
}) {
  const filtered = rows.filter(
    (r) =>
      r.metric === metric &&
      r.location === location &&
      r.stage === stage
  );

  const trained = filtered
    .filter((r) => r.group === "trained")
    .flatMap((r) => r.sessions ?? [])
    .map(Number)
    .filter(Number.isFinite);

  const untrained = filtered
    .filter((r) => r.group === "untrained")
    .flatMap((r) => r.sessions ?? [])
    .map(Number)
    .filter(Number.isFinite);

  return [
    { group: "trained", values: trained },
    { group: "untrained", values: untrained },
  ];
}

export function getPairChanges({
  metric = "cognitive",
  location = "indoor",
}) {
  return changes
    .filter((d) => d.metric === metric && d.location === location)
    .map((d) => ({
      pairId: d.pair_id,
      child: d.child,
      peer: d.peer,
      group: d.group,
      pre: d.pre_mean,
      post: d.post_mean,
      change: d.change,
    }));
}

export function getWeightSensitivity({
  metric = "cognitive",
  location = "indoor",
  stage = "post",
  group = "trained",
}) {
  const source =
    metric === "cognitive"
      ? weightSensitivity.cognitive ?? []
      : weightSensitivity.social ?? [];

  return source.map((entry) => {
    const match = (entry.summaries ?? []).find(
      (s) =>
        s.metric === metric &&
        s.location === location &&
        s.stage === stage &&
        s.group === group
    );

    return {
      x:
        metric === "cognitive"
          ? entry.varied_weights?.non_play
          : entry.varied_weights?.lowest_cat,
      y:
        metric === "cognitive"
          ? entry.varied_weights?.stereotype
          : entry.varied_weights?.next_cat,
      value: match?.mean_of_pair_means ?? null,
      nPairs: match?.n_pairs ?? 0,
    };
  });
}

export function getSummaryTable() {
  return summaries.map((d) => ({
    metric: d.metric,
    location: d.location,
    stage: d.stage,
    group: d.group,
    mean: d.mean_of_pair_means,
    sem: d.sem_of_pair_means,
    ci95: d.ci95_of_pair_means,
    nPairs: d.n_pairs,
  }));
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}