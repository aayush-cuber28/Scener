import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function Register() {
  const [form, setForm] = useState({ nickname: "", email: "", password: "", dateOfBirth: "" });
  const [error, setError] = useState("");
  const { saveLogin } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/auth/register", { method: "POST", body: form });
      saveLogin(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="form-box">
      <h1>Join Scener</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Nickname (3-15 letters, numbers, underscore)</label>
        <input value={form.nickname} onChange={(e) => update("nickname", e.target.value)} required />
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
        <label>Password (min 6 characters)</label>
        <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
        <label>Date of birth (used for 18+ content)</label>
        <input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} required />
        <button className="btn" type="submit">Create account</button>
      </form>
      <p className="muted small" style={{ marginTop: 14 }}>
        Already have an account? <Link to="/login" className="accent-link">Log in</Link>
      </p>
    </div>
  );
}