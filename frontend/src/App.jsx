import { Routes, Route, Link, NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TitleDetail from "./pages/TitleDetail";
import Requests from "./pages/Requests";
import ReviewForm from "./pages/ReviewForm";

function NotFound() {
  return (
    <div className="empty-state">
      <h1>Page not found</h1>
      <p className="muted">That page doesn't exist.</p>
      <Link to="/" className="btn" style={{ marginTop: 16, display: "inline-block" }}>Go home</Link>
    </div>
  );
}

export default function App() {
  const { auth, logout } = useAuth();
  const isAdmin = auth?.user.role === "admin";

  return (
    <>
      <nav className="nav">
        <Link to="/" className="brand">
          <span>S</span>cener
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/requests">Requests</NavLink>
          {isAdmin && <NavLink to="/add" className="nav-cta">+ Add review</NavLink>}
          {auth ? (
            <>
              <span className="nick">
                @{auth.user.nickname}
                {isAdmin && <span className="role-tag">owner</span>}
              </span>
              <button className="btn-ghost" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Sign up</NavLink>
            </>
          )}
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/title/:id" element={<TitleDetail />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/add" element={<ReviewForm />} />
          <Route path="/edit/:id" element={<ReviewForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer muted small">
        Scener · Movies, music &amp; series reviews by the community
      </footer>
    </>
  );
}
