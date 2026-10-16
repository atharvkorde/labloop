
import { useEffect, useMemo, useState } from "react";
import "./index.css";

const initialReports = [
  { id: "LAB-1042", title: "Oscilloscope not powering on", category: "Electronics", location: "Lab 204", priority: "High", status: "In Progress", student: "Demo Student", email: "demo@college.edu", type: "Fault", date: "Today" },
  { id: "LAB-1041", title: "Request for Arduino Uno", category: "Microcontrollers", location: "Lab 105", priority: "Medium", status: "Pending", student: "Demo Student", email: "demo@college.edu", type: "Equipment", date: "Today" },
  { id: "LAB-1040", title: "Loose connection in trainer kit", category: "Electronics", location: "Lab 204", priority: "Low", status: "Resolved", student: "Demo Student", email: "demo@college.edu", type: "Fault", date: "Yesterday" },
];

const emptyForm = {
  title: "",
  category: "Electronics",
  location: "",
  priority: "Medium",
  type: "Fault",
  student: "",
  email: "",
  description: "",
};

const readReports = () => {
  try {
    const saved = localStorage.getItem("labloop-reports");
    return saved ? JSON.parse(saved) : initialReports;
  } catch {
    return initialReports;
  }
};

function App() {
  const [reports, setReports] = useState(readReports);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    localStorage.setItem("labloop-reports", JSON.stringify(reports));
  }, [reports]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === "Pending").length,
    progress: reports.filter(r => r.status === "In Progress").length,
    resolved: reports.filter(r => r.status === "Resolved").length,
  }), [reports]);

  const filteredReports = useMemo(() => reports.filter(r => {
    const matchesQuery = `${r.id} ${r.title} ${r.location} ${r.category} ${r.student}`
      .toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All" || r.status === filter;
    return matchesQuery && matchesFilter;
  }), [reports, query, filter]);

  function updateField(e) {
    const { name, value } = e.target;
    setForm(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: "" }));
    setMessage("");
  }

  function validate() {
    const next = {};
    if (form.student.trim().length < 2) next.student = "Enter your full name (at least 2 characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email address.";
    if (form.title.trim().length < 5) next.title = "Title must contain at least 5 characters.";
    if (form.title.trim().length > 70) next.title = "Title cannot exceed 70 characters.";
    if (form.location.trim().length < 2) next.location = "Enter a valid lab or room location.";
    if (form.description.trim().length < 15)
      next.description = "Description must contain at least 15 characters.";
    if (form.description.trim().length > 400)
      next.description = "Description cannot exceed 400 characters.";
    return next;
  }

  function submitReport(e) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length) {
      setMessage("Please correct the highlighted fields.");
      return;
    }

    const duplicate = reports.some(r =>
      r.type === form.type &&
      r.title.trim().toLowerCase() === form.title.trim().toLowerCase() &&
      r.location.trim().toLowerCase() === form.location.trim().toLowerCase() &&
      r.email.toLowerCase() === form.email.trim().toLowerCase() &&
      r.status !== "Resolved"
    );

    if (duplicate) {
      setErrors({ title: "A matching active request already exists." });
      setMessage("Duplicate request detected.");
      return;
    }

    const report = {
      ...form,
      title: form.title.trim(),
      student: form.student.trim(),
      email: form.email.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      id: `LAB-${Date.now().toString().slice(-6)}`,
      status: "Pending",
      date: new Date().toLocaleDateString("en-IN"),
    };

    setReports(previous => [report, ...previous]);
    setForm(emptyForm);
    setErrors({});
    setMessage(`Success! Request ${report.id} has been submitted.`);
    setActiveTab("Dashboard");
    setFilter("All");
    setQuery("");
  }

  function changeStatus(id, status) {
    setReports(previous => previous.map(r => r.id === id ? { ...r, status } : r));
    setSelected(previous => previous?.id === id ? { ...previous, status } : previous);
  }

  function deleteReport(id) {
    setReports(previous => previous.filter(r => r.id !== id));
    setSelected(null);
  }

  function resetDemo() {
    if (window.confirm("Reset all reports to the original demo data?")) {
      setReports(initialReports);
      setSelected(null);
      setQuery("");
      setFilter("All");
      setMessage("Demo data restored.");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">L<span>+</span></div>
          <div><strong>labloop</strong><small>LAB OPERATIONS</small></div>
        </div>

        <div className="side-label">WORKSPACE</div>
        {[
          ["Dashboard", "▦"],
          ["New Request", "＋"],
          ["All Requests", "▤"],
        ].map(([label, icon]) => (
          <button key={label}
            className={`nav-item ${activeTab === label ? "active" : ""}`}
            onClick={() => {
              setActiveTab(label);
              setMessage("");
              if (label === "New Request") setForm(emptyForm);
            }}>
            <span>{icon}</span>{label}
            {label === "All Requests" && <span className="nav-count">{reports.length}</span>}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="online-dot" />
          <div><strong>Lab services</strong><small>Local demo workspace</small></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <div className="eyebrow">MIT AOE · WEB TECHNOLOGY</div>
            <h1>{activeTab === "New Request" ? "Create a request" : activeTab === "All Requests" ? "Request register" : "Laboratory overview"}</h1>
          </div>
          <div className="topbar-right">
            <span className="live-pill"><span /> DEMO MODE</span>
            <div className="avatar">S</div>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <h2>Good to see you, Student <span>✳</span></h2>
              <p>Keep your lab running. Every request has a place.</p>
            </div>
            <button className="primary-btn" onClick={() => {
              setActiveTab("New Request");
              setMessage("");
            }}>＋ New request</button>
          </div>

          {message && <div className={`notice ${message.startsWith("Success") || message.includes("restored") ? "success" : "warning"}`} role="status">{message}</div>}

          {activeTab === "New Request" && (
            <section className="panel form-panel">
              <div className="panel-heading">
                <div><span className="eyebrow">REQUEST WORKFLOW / 01</span><h2>Tell us what you need</h2><p>Fields marked * are required.</p></div>
                <span className="form-symbol">↗</span>
              </div>

              <form onSubmit={submitReport} noValidate>
                <div className="form-grid">
                  <label>Request type *
                    <select name="type" value={form.type} onChange={updateField}>
                      <option>Fault</option><option>Equipment</option>
                    </select>
                  </label>

                  <label>Category *
                    <select name="category" value={form.category} onChange={updateField}>
                      <option>Electronics</option><option>Microcontrollers</option>
                      <option>Computer Systems</option><option>Networking</option>
                      <option>Mechanical</option><option>Other</option>
                    </select>
                  </label>

                  <label className="full-field">Request title *
                    <input name="title" value={form.title} onChange={updateField} placeholder="e.g. Digital multimeter display is blank" maxLength={80} aria-invalid={!!errors.title}/>
                    {errors.title && <span className="field-error">{errors.title}</span>}
                  </label>

                  <label>Lab / Room *
                    <input name="location" value={form.location} onChange={updateField} placeholder="e.g. Lab 204"/>
                    {errors.location && <span className="field-error">{errors.location}</span>}
                  </label>

                  <label>Priority *
                    <select name="priority" value={form.priority} onChange={updateField}>
                      <option>Low</option><option>Medium</option><option>High</option>
                    </select>
                  </label>

                  <label>Student name *
                    <input name="student" value={form.student} onChange={updateField} placeholder="Your full name"/>
                    {errors.student && <span className="field-error">{errors.student}</span>}
                  </label>

                  <label>College email *
                    <input type="email" name="email" value={form.email} onChange={updateField} placeholder="you@college.edu"/>
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </label>

                  <label className="full-field">Issue description *
                    <textarea name="description" value={form.description} onChange={updateField} rows="4" maxLength={400} placeholder="Describe the equipment, what happened, and any steps already tried."/>
                    <span className="field-hint">{form.description.length}/400 characters</span>
                    {errors.description && <span className="field-error">{errors.description}</span>}
                  </label>
                </div>

                <div className="form-footer">
                  <button type="button" className="secondary-btn" onClick={() => { setForm(emptyForm); setErrors({}); setMessage(""); }}>Clear form</button>
                  <button type="submit" className="primary-btn">Submit request ↗</button>
                </div>
              </form>
            </section>
          )}

          {activeTab !== "New Request" && (
            <>
              {activeTab === "Dashboard" && (
                <div className="stats-grid">
                  {[
                    ["Total requests", stats.total, "All submissions", "total"],
                    ["Awaiting review", stats.pending, "Needs attention", "pending"],
                    ["Being handled", stats.progress, "In progress", "progress"],
                    ["Completed", stats.resolved, "Resolved requests", "resolved"],
                  ].map(([label, value, caption, key]) => (
                    <button className="stat-card" key={key} onClick={() => { setFilter(key === "total" ? "All" : key === "pending" ? "Pending" : key === "progress" ? "In Progress" : "Resolved"); setActiveTab("All Requests"); }}>
                      <div className="stat-top"><span>{label}</span><span className={`stat-dot ${key}`}/></div>
                      <div className="stat-value">{value}</div>
                      <div className="stat-caption">{caption} <span>↗</span></div>
                    </button>
                  ))}
                </div>
              )}

              <section className="panel requests-panel">
                <div className="panel-heading request-heading">
                  <div><span className="eyebrow">{activeTab === "Dashboard" ? "LIVE WORKSPACE" : "ALL SUBMISSIONS"}</span><h2>{activeTab === "Dashboard" ? "Recent requests" : "Request register"}</h2><p>Search, inspect, and update laboratory requests.</p></div>
                  <button className="secondary-btn" onClick={resetDemo}>Reset demo</button>
                </div>

                <div className="toolbar">
                  <div className="search-box"><span>⌕</span><input aria-label="Search requests" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title, ID, room..."/></div>
                  <select aria-label="Filter by status" value={filter} onChange={e => setFilter(e.target.value)}>
                    <option>All</option><option>Pending</option><option>In Progress</option><option>Resolved</option>
                  </select>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead><tr><th>REQUEST</th><th>CATEGORY</th><th>PRIORITY</th><th>STATUS</th><th>DETAILS</th></tr></thead>
                    <tbody>
                      {filteredReports.slice(0, activeTab === "Dashboard" ? 5 : undefined).map(r => (
                        <tr key={r.id}>
                          <td><div className="request-title">{r.title}</div><div className="muted">{r.id} · {r.location}</div></td>
                          <td>{r.category}<div className="muted">{r.type}</div></td>
                          <td><span className={`priority ${r.priority.toLowerCase()}`}>{r.priority}</span></td>
                          <td><span className={`status ${r.status.toLowerCase().replace(" ", "-")}`}>{r.status}</span></td>
                          <td><button className="view-btn" onClick={() => setSelected(r)}>View ↗</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredReports.length === 0 && <div className="empty-state"><div>⌕</div><strong>No matching requests</strong><p>Try another search or change the status filter.</p><button className="secondary-btn" onClick={() => {setQuery("");setFilter("All");}}>Clear filters</button></div>}
                </div>
                <div className="table-footer">Showing {filteredReports.length === 0 ? 0 : Math.min(filteredReports.length, activeTab === "Dashboard" ? 5 : filteredReports.length)} of {filteredReports.length} matching requests</div>
              </section>
            </>
          )}

          <footer>LABLOOP <span>·</span> REACTJS PRACTICAL NO. 3 <span>·</span> CLIENT-SIDE VALIDATION</footer>
        </section>
      </main>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}>
            <div className="modal-top"><span className="eyebrow">{selected.id}</span><button className="close-btn" onClick={() => setSelected(null)}>✕</button></div>
            <h2 id="modal-title">{selected.title}</h2>
            <p className="modal-description">{selected.description || "Demo request. No additional description supplied."}</p>
            <div className="detail-grid">
              <div><small>TYPE</small><strong>{selected.type}</strong></div>
              <div><small>CATEGORY</small><strong>{selected.category}</strong></div>
              <div><small>LOCATION</small><strong>{selected.location}</strong></div>
              <div><small>PRIORITY</small><strong>{selected.priority}</strong></div>
              <div><small>SUBMITTED BY</small><strong>{selected.student}</strong></div>
              <div><small>DATE</small><strong>{selected.date}</strong></div>
            </div>
            <label>Update request status
              <select value={selected.status} onChange={e => changeStatus(selected.id, e.target.value)}>
                <option>Pending</option><option>In Progress</option><option>Resolved</option>
              </select>
            </label>
            <div className="modal-actions">
              <button className="secondary-btn danger-btn" onClick={() => deleteReport(selected.id)}>Delete request</button>
              <button className="primary-btn" onClick={() => setSelected(null)}>Done</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
