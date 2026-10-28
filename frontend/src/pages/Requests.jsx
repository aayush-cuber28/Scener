import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, timeAgo } from "../api";
import { useAuth } from "../AuthContext";
import { CATEGORY_ICONS } from "../genres";

export default function Requests() {
  const { auth } = useAuth();
  const token = auth?.token;
  const isAdmin = auth?.user.role === "admin";
  const [status, setStatus] = useState("open");
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", category: "movie", note: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setList(await api(`/requests?status=${status}`));
    } catch (e) {
      setError(e.message);
    }
  }, [status]);

  useEffect(() => {
    // load() only sets state after the request finishes, so this is safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/requests", { method: "POST", token, body: form });
      setForm({ name: "", category: "movie", note: "" });
      setMessage("Request added!");
      setStatus("open");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function upvote(id) {
    setError("");
    try {
      await api(`/requests/${id}/upvote`, { method: "POST", token });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markReviewed(id) {
    try {
      await api(`/requests/${id}/reviewed`, { method: "PATCH", token });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h1>Request a review</h1>
      <p className="muted">Ask the owner to review something. The most upvoted requests go first.</p>

      {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
      {message && <p className="success" style={{ marginTop: 12 }}>{message}</p>}

      {auth ? (
        <form onSubmit={submit} className="request-form">
          <input
            placeholder="Movie, song or series name"
            value={form.name}
            maxLength={100}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="movie">Movie</option>
            <option value="song">Song</option>
            <option value="series">Series</option>
          </select>
          <input
            placeholder="Why should it be reviewed? (optional)"
            value={form.note}
            maxLength={300}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <button className="btn" type="submit">Submit request</button>
        </form>
      ) : (
        <p className="muted" style={{ marginTop: 12 }}>
          <Link to="/login" className="accent-link">Log in</Link> to make or upvote requests.
        </p>
      )}

      <div className="tabs" style={{ marginTop: 24 }}>
        <button className={status === "open" ? "tab active" : "tab"} onClick={() => setStatus("open")}>
          Open requests
        </button>
        <button className={status === "reviewed" ? "tab active" : "tab"} onClick={() => setStatus("reviewed")}>
          Reviewed
        </button>
      </div>

      {list.length === 0 && <p className="muted">{status === "open" ? "No open requests." : "Nothing reviewed yet."}</p>}
      {list.map((r) => {
        const voted = auth && r.upvotes.includes(auth.user.id);
        return (
          <div className="req-item" key={r._id}>
            <button
              className={voted ? "upvote-btn voted" : "upvote-btn"}
              disabled={!auth || status !== "open"}
              title={auth ? "" : "Log in to upvote"}
              onClick={() => upvote(r._id)}
            >
              ▲ {r.upvoteCount}
            </button>
            <div className="req-info">
              <strong>{CATEGORY_ICONS[r.category]} {r.name}</strong>{" "}
              <span className="card-meta">({r.category})</span>
              {r.note && <div className="muted small">{r.note}</div>}
              <div className="muted small">requested by @{r.nickname} · {timeAgo(r.createdAt)}</div>
            </div>
            {isAdmin && status === "open" && (
              <div className="req-actions">
                <Link
                  className="btn btn-small"
                  to={`/add?name=${encodeURIComponent(r.name)}&category=${r.category}`}
                >
                  Write review
                </Link>
                <button className="btn-ghost" onClick={() => markReviewed(r._id)}>Mark reviewed</button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
