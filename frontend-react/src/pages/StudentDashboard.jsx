import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles.css"; // reuse your CSS

function StudentDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get("/student/enrollments");
        setEnrollments(res.data);
      } catch (err) {
        setError("Failed to load dashboard");
      }
    }
    loadDashboard();
  }, []);

  return (
    <section className="card">
      <h2>Student Dashboard</h2>

      {error && <p className="error-msg">{error}</p>}

      <div className="dashboard-grid">
        {enrollments.map((e) => (
          <div key={e.id} className="dash-widget">
            <h3>{e.Course.title}</h3>
            <p>{e.Course.description}</p>

            <div className="progress">
              <i style={{ width: `${e.progress}%` }} />
            </div>

            <p>{e.progress}% completed</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StudentDashboard;
