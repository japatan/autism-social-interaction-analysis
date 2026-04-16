# COSC3000 Data Visualisation Project - The University of Queensland

## 📊 Overview
This project explores how training influences social interaction outcomes in children with autism through interactive data visualisations.

The system processes behavioural session data and presents insights through multiple visualisations, including:
- grouped comparisons
- session-level trends
- distribution analysis
- sensitivity analysis

The goal is to transform complex behavioural datasets into intuitive visual insights that support interpretation and analysis.

---

## 🎯 Project Objectives
- Compare trained vs untrained interactions
- Analyse session-level behavioural changes
- Understand variability across participants and conditions
- Evaluate robustness of scoring through sensitivity analysis

---

## 📁 Dataset
The dataset consists of multiple `.dtx` files representing interaction sessions between children.

These files are processed into structured formats:
- `rows` → individual session data
- `summaries` → aggregated statistics
- `changes` → pre/post differences
- `weight_sensitivity` → model robustness analysis

---

## 📈 Visualisations

### 1. Grouped Bar Chart (Mean Comparison)
- Compares average scores across:
  - Indoor vs Outdoor
  - Pre vs Post
  - Trained vs Untrained
- Includes uncertainty using standard error of the mean (SEM)

### 2. Session Scatter Plot
- Displays session-by-session scores for an example participant
- Highlights trends over time
- Includes linear trend lines

### 3. Box Plot (Distribution Analysis)
- Shows score distribution across conditions
- Highlights:
  - median
  - variability (IQR)
  - outliers

### 4. Heatmap (Weight Sensitivity)
- Analyses how scoring changes with different model weights
- Demonstrates robustness of results
- Smooth gradients indicate stable behaviour

---

## 🛠️ Tech Stack
- React
- Apache ECharts
- JavaScript (ES6)
- Python (data preprocessing)

---

## ⚙️ How It Works
1. Raw `.dtx` files are parsed and cleaned
2. Data is transformed into structured JSON
3. Helper functions aggregate and filter data
4. ECharts renders interactive visualisations

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Install dependencies
```bash
npm install
```

### 2. Run development server
```bash
npm run dev
```

### 3. Open in browser
http://localhost:5173

---

## 📚 Research Background
This project is based on research in autism and peer-mediated learning.
- 📄 Thesis
_Peer training for improved social interaction in children with autism_ 
Serene Hyun-Jin Choi, BA, MSpEd, MEdStud
- 📖 Book
_Special Education in the 21st Century_
Edited by Maryann T. Burton

---

## 🔗 Reference Notes
This project uses the research above as the conceptual basis for understanding:
- peer training
- cognitive and social interaction measures
- behavioural change across intervention conditions
- Thesis    : [Peer training for improved social interaction in children with autism](https://www.researchgate.net/publication/37618061_Improved_Social_Interaction_by_Children_With_Autism_by_Training_of_Peers)
- Book      : [Special Education in the 21st Century (Education in a Competitive and Globalizing World)](https://www.amazon.com.au/Special-Education-Century-Competitive-Globalizing/dp/1607415569)

---

## 🧠 Key Insights
- Peer training consistently improves cognitive interaction scores
- Score improvements are more pronounced in post-intervention conditions
- Variability exists across participants, highlighting individual differences
- Results remain reasonably stable across different weight configurations

---

## 📌 Notes
- The scatter plot represents an example participant, not the full dataset
- Box plots and bar charts summarise across all available data
- The heatmap reflects model behaviour under varied weights rather than raw observations

---

## 👤 Author
Dzaky Zhafran Razzansyah
COSC3000 Student Project 
The University of Queensland

## 📄 License
This project is submitted as coursework for COSC3000 at The University of Queensland. Not licensed for redistribution or commercial use.