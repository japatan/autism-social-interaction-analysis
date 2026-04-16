#!/usr/bin/env python3
import json
import glob
import math
import numpy as np
from pathlib import Path

data_directory = "../vis_project_data/"
output_path = "src/data/results_full.json"

# Session dimensions
session_types = ["cog", "so"]
whatdoors = ["indoor", "outdoor"]
whichs = ["base", "inter"]

combined_scenarios = [
    (ses_type, whatdoor, which)
    for ses_type in session_types
    for whatdoor in whatdoors
    for which in whichs
]

# Corrected/default weights
soc_weights = np.array([-1, 0, 1, 2, 2, 3, 5], dtype=float)
cog_weights = np.array([0, -1, 1, 2, 2, 3, 5], dtype=float)


def combined_score(filename, weights):
    """
    Return weighted average score for one session file.
    """
    with open(filename, "r", encoding="utf-8") as file:
        score = 0.0
        total_duration = 0.0
        t_end_prev = 0.0

        for count, line in enumerate(file.readlines()):
            if not line.strip():
                continue

            if count == 0:
                # skip header
                continue

            if line[0] == "*":
                break

            data = line.split(",", 4)
            if len(data) < 3:
                continue

            t_category = int(data[0])
            t_beg = int(data[1])
            t_end = int(data[2])

            if t_beg != t_end_prev:
                print(f"Warning: missing timestamp in {filename}")
            t_end_prev = t_end

            duration = float(t_end - t_beg)
            total_duration += duration
            score += weights[t_category - 1] * duration

        if total_duration == 0:
            return np.nan

        return score / total_duration


def unique_pairs():
    """
    Extract unique child-peer pairs from filenames.
    Expected filename pattern includes child at index 4 and peer at index 5.
    """
    all_files = glob.glob(data_directory + "*.dtx")
    pairs = []

    for file in all_files:
        name = Path(file).name
        parts = name.split("-")
        if len(parts) >= 7:
            child = parts[4]
            peer = parts[5]
            pairs.append((child, peer))

    return sorted(set(pairs))


def get_group(peer):
    first = peer[0].lower()
    return "trained" if first in ["u", "v", "w", "x", "y", "z"] else "untrained"


def metric_label(session_type):
    return "cognitive" if session_type == "cog" else "social"


def stage_label(which):
    return "pre" if which == "base" else "post"


def ci95_from_sem(sem):
    """
    Approximate 95% CI half-width using normal approximation.
    Assignment allows using standard errors / normality assumption.
    """
    return 1.96 * sem


def mean_sem(values):
    arr = np.array(values, dtype=float)
    n = len(arr)
    if n == 0:
        return None, None
    mean = float(arr.mean())
    if n == 1:
        return mean, 0.0
    sem = float(arr.std(ddof=1) / np.sqrt(n))
    return mean, sem


def collect_pair_data():
    """
    Returns:
      - pairs_nested: nested pair-oriented records
      - rows: flat chart-friendly rows
    """
    pairs_nested = []
    rows = []
    pairs = unique_pairs()

    print("Unique pairs found:", pairs)

    for child, peer in pairs:
        group = get_group(peer)

        pair_record = {
            "pair_id": f"{child}-{peer}",
            "child": child,
            "peer": peer,
            "group": group,
            "conditions": []
        }

        for ses_type, whatdoor, which in combined_scenarios:
            weights = cog_weights if ses_type == "cog" else soc_weights
            pattern = data_directory + f"{ses_type}-*-{which}-*-{child}-{peer}-{whatdoor}.dtx"
            files = sorted(glob.glob(pattern))

            scores = []
            for file in files:
                s = combined_score(file, weights)
                if not np.isnan(s):
                    scores.append(float(s))

            if not scores:
                continue

            mean, sem = mean_sem(scores)
            ci95 = ci95_from_sem(sem)

            condition_record = {
                "metric_code": ses_type,
                "metric": metric_label(ses_type),
                "location": whatdoor,
                "stage_code": which,
                "stage": stage_label(which),
                "mean": mean,
                "sem": sem,
                "ci95": ci95,
                "n": len(scores),
                "sessions": scores
            }
            pair_record["conditions"].append(condition_record)

            # Flat row per condition
            rows.append({
                "pair_id": f"{child}-{peer}",
                "child": child,
                "peer": peer,
                "group": group,
                "metric_code": ses_type,
                "metric": metric_label(ses_type),
                "location": whatdoor,
                "stage_code": which,
                "stage": stage_label(which),
                "mean": mean,
                "sem": sem,
                "ci95": ci95,
                "n": len(scores),
                "sessions": scores
            })

        if pair_record["conditions"]:
            pairs_nested.append(pair_record)

    return pairs_nested, rows


def group_rows(rows, keys):
    grouped = {}
    for row in rows:
        key = tuple(row[k] for k in keys)
        grouped.setdefault(key, []).append(row)
    return grouped


def build_summaries(rows):
    """
    Summary means across pairs for chart-ready grouped comparisons.
    Uses pair means as the input values.
    """
    summary_rows = []
    grouped = group_rows(rows, ["group", "metric", "location", "stage"])

    for key, group_list in grouped.items():
        values = [r["mean"] for r in group_list]
        mean, sem = mean_sem(values)
        ci95 = ci95_from_sem(sem)

        summary_rows.append({
            "group": key[0],
            "metric": key[1],
            "location": key[2],
            "stage": key[3],
            "mean_of_pair_means": mean,
            "sem_of_pair_means": sem,
            "ci95_of_pair_means": ci95,
            "n_pairs": len(values),
            "pair_ids": [r["pair_id"] for r in group_list],
            "pair_means": values
        })

    return sorted(summary_rows, key=lambda x: (x["metric"], x["location"], x["group"], x["stage"]))


def build_changes(rows):
    """
    Build post-pre change per pair for each metric/location.
    """
    changes = []
    grouped = group_rows(rows, ["pair_id", "group", "metric", "location"])

    for key, group_list in grouped.items():
        pre = next((r for r in group_list if r["stage"] == "pre"), None)
        post = next((r for r in group_list if r["stage"] == "post"), None)

        if pre is None or post is None:
            continue

        changes.append({
            "pair_id": key[0],
            "group": key[1],
            "metric": key[2],
            "location": key[3],
            "child": pre["child"],
            "peer": pre["peer"],
            "pre_mean": pre["mean"],
            "post_mean": post["mean"],
            "change": post["mean"] - pre["mean"]
        })

    return sorted(changes, key=lambda x: (x["metric"], x["location"], x["group"], x["pair_id"]))


def build_weight_sensitivity(rows_source_pairs, cog_range=None, soc_range=None):
    """
    Optional lightweight sensitivity export.
    Recomputes grouped summaries for a small range of first two cognitive weights
    and first two social weights.
    """
    if cog_range is None:
        cog_range = [-1.0, -0.5, 0.0, 0.5]
    if soc_range is None:
        soc_range = [-1.0, -0.5, 0.0, 0.5]

    sensitivity = {
        "cognitive": [],
        "social": []
    }

    # Cognitive: vary first two weights only
    for w0 in cog_range:
        for w1 in cog_range:
            test_cog = np.array([w0, w1, 1, 2, 2, 3, 5], dtype=float)
            test_rows = recompute_rows(rows_source_pairs, test_cog, soc_weights)
            summaries = build_summaries(test_rows)

            sensitivity["cognitive"].append({
                "weights": test_cog.tolist(),
                "varied_weights": {"non_play": w0, "stereotype": w1},
                "summaries": [
                    s for s in summaries if s["metric"] == "cognitive"
                ]
            })

    # Social: vary first two weights only
    for w0 in soc_range:
        for w1 in soc_range:
            test_soc = np.array([w0, w1, 1, 2, 2, 3, 5], dtype=float)
            test_rows = recompute_rows(rows_source_pairs, cog_weights, test_soc)
            summaries = build_summaries(test_rows)

            sensitivity["social"].append({
                "weights": test_soc.tolist(),
                "varied_weights": {"lowest_cat": w0, "next_cat": w1},
                "summaries": [
                    s for s in summaries if s["metric"] == "social"
                ]
            })

    return sensitivity


def recompute_rows(pairs, cognitive_weights, social_weights):
    """
    Recompute flat rows using alternative weights.
    Useful for sensitivity analysis.
    """
    rows = []

    for child, peer in pairs:
        group = get_group(peer)

        for ses_type, whatdoor, which in combined_scenarios:
            weights = cognitive_weights if ses_type == "cog" else social_weights
            pattern = data_directory + f"{ses_type}-*-{which}-*-{child}-{peer}-{whatdoor}.dtx"
            files = sorted(glob.glob(pattern))

            scores = []
            for file in files:
                s = combined_score(file, weights)
                if not np.isnan(s):
                    scores.append(float(s))

            if not scores:
                continue

            mean, sem = mean_sem(scores)
            ci95 = ci95_from_sem(sem)

            rows.append({
                "pair_id": f"{child}-{peer}",
                "child": child,
                "peer": peer,
                "group": group,
                "metric_code": ses_type,
                "metric": metric_label(ses_type),
                "location": whatdoor,
                "stage_code": which,
                "stage": stage_label(which),
                "mean": mean,
                "sem": sem,
                "ci95": ci95,
                "n": len(scores),
                "sessions": scores
            })

    return rows


if __name__ == "__main__":
    all_files = glob.glob(data_directory + "*.dtx")
    all_pairs = unique_pairs()

    print("Using data directory:", data_directory)
    print("Found dtx files:", len(all_files))

    pairs_nested, rows = collect_pair_data()
    summaries = build_summaries(rows)
    changes = build_changes(rows)

    export = {
        "metadata": {
            "source_directory": data_directory,
            "n_files": len(all_files),
            "n_pairs": len(all_pairs),
            "session_types": {
                "cog": "cognitive",
                "so": "social"
            },
            "stages": {
                "base": "pre",
                "inter": "post"
            },
            "locations": whatdoors,
            "weights": {
                "cognitive": cog_weights.tolist(),
                "social": soc_weights.tolist()
            },
            "notes": [
                "Cognitive weights use corrected non-play/stereotype order from task sheet.",
                "CI95 is approximated as 1.96 * SEM.",
                "Summaries are based on pair means, not pooled raw sessions."
            ]
        },
        "pairs": pairs_nested,
        "rows": rows,
        "summaries": summaries,
        "changes": changes,
        # Comment out if you want faster export during development
        "weight_sensitivity": build_weight_sensitivity(all_pairs)
    }

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(export, f, indent=2)

    print(f"Exported JSON to {output_path}")
    print(f"Pairs exported: {len(pairs_nested)}")
    print(f"Rows exported: {len(rows)}")
    print(f"Summary rows exported: {len(summaries)}")
    print(f"Change rows exported: {len(changes)}")