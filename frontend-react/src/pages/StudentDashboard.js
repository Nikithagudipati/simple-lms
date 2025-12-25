function StudentDashboard() {
  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="logo">SimpleLMS</div>
        <div className="user">Student One (student)</div>
      </nav>

      <div className="content">
        <h1>Student Dashboard</h1>

        <section className="courses">
          <h2>My Enrolled Courses</h2>

          <div className="course-card">
            <h3>Data Structures</h3>
            <div className="progress-bar">
              <div className="progress" style={{ width: "70%" }}></div>
            </div>
          </div>

          <div className="course-card">
            <h3>JavaScript</h3>
            <div className="progress-bar">
              <div className="progress" style={{ width: "50%" }}></div>
            </div>
          </div>
        </section>

        <section className="summary">
          <h2>Summary</h2>

          <div className="charts">
            <div className="chart-box">Time Spent Chart</div>
            <div className="chart-box">Quiz Marks Chart</div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StudentDashboard;
