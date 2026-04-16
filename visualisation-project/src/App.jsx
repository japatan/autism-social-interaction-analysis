import "./App.css";
import ScoreBarChart from "./charts/ScoreBarChart";
import SessionScatterChart from "./charts/SessionScatterChart";
import BoxPlotChart from "./charts/BoxPlotChart";
import WeightSensitivityChart from "./charts/WeightSensitivityChart";

function App() {
  return (
    <div className="page">
      <header className="hero">
        <h1 className="course-title">COSC3000 Visualisation Project</h1>
        <p>Peer training for improved social interaction
            in children with autism
        </p>
      </header>

      <section className="card">
        <ScoreBarChart />
      </section>

      <section className="card">
        <SessionScatterChart />
      </section>

      <section className="card">
        <BoxPlotChart />
      </section>

      <section className="card">
        <WeightSensitivityChart />
      </section>
    </div>
  );
}

export default App;