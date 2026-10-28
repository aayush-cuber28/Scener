import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { GENRES } from "../genres";

// One form for both "Add review" (/add) and "Edit review" (/edit/:id).
export default function ReviewForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const { auth } = useAuth();
  const navigate = useNavigate();

  const startCategory = GENRES[searchParams.get("category")] ? searchParams.get("category") : "movie";
  const [form, setForm] = useState({
    name: searchParams.get("name") || "",
    category: startCategory,
    genres: [],
    year: "",
    reviewText: "",
    ownerScore: "",
    isMature: false,
  });
  const [poster, setPoster] = useState(null);
  const [currentPoster, setCurrentPoster] = useState("");
  const [removePoster, setRemovePoster] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const isAdmin = auth?.user.role === "admin";
  const token = auth?.token;

  useEffect(() => {
    if (!isEdit || !isAdmin) return;
    api(`/titles/${id}`, { token })
      .then((t) => {
        setForm({
          name: t.name,
          category: t.category,
          genres: t.genres || [],
          year: t.year ?? "",
          reviewText: t.reviewText || "",
          ownerScore: t.ownerScore,
          isMature: t.isMature,
        });
        setCurrentPoster(t.poster);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit, isAdmin, token]);

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <p className="error">Only the site owner can add or edit reviews.</p>
        {!auth && <Link to="/login" className="btn">Log in</Link>}
      </div>
    );
  }
  if (loading) return <p className="muted">Loading...</p>;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function changeCategory(category) {
    // Keep only genres that also exist in the new category.
    setForm((f) => ({ ...f, category, genres: f.genres.filter((g) => GENRES[category].includes(g)) }));
  }

  function toggleGenre(genre) {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(genre) ? f.genres.filter((g) => g !== genre) : [...f.genres, genre],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const data = new FormData();
    data.append("name", form.name);
    data.append("category", form.category);
    data.append("genres", form.genres.join(","));
    data.append("year", form.year);
    data.append("reviewText", form.reviewText);
    data.append("ownerScore", form.ownerScore);
    data.append("isMature", form.isMature);
    if (poster) data.append("poster", poster);
    if (isEdit && removePoster && !poster) data.append("removePoster", "true");

    try {
      const saved = await api(isEdit ? `/titles/${id}` : "/titles", {
        method: isEdit ? "PUT" : "POST",
        token,
        body: data,
        isForm: true,
      });
      navigate(`/title/${saved._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="form-box form-wide">
      <h1>{isEdit ? "Edit review" : "Add a review"}</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={submit}>
        <label>Name</label>
        <input value={form.name} onChange={(e) => update("name", e.target.value)} required maxLength={150} />

        <div className="form-row">
          <div>
            <label>Type</label>
            <select value={form.category} onChange={(e) => changeCategory(e.target.value)}>
              <option value="movie">Movie</option>
              <option value="song">Song</option>
              <option value="series">Series</option>
            </select>
          </div>
          <div>
            <label>Year</label>
            <input type="number" value={form.year} onChange={(e) => update("year", e.target.value)} />
          </div>
          <div>
            <label>Your score (0-10)</label>
            <input type="number" step="0.1" min="0" max="10" value={form.ownerScore}
              onChange={(e) => update("ownerScore", e.target.value)} required />
          </div>
        </div>

        <label>Genres (pick one or more)</label>
        <div className="chips chips-form">
          {GENRES[form.category].map((g) => (
            <button type="button" key={g}
              className={form.genres.includes(g) ? "chip active" : "chip"}
              onClick={() => toggleGenre(g)}>
              {g}
            </button>
          ))}
        </div>

        <label>Your review</label>
        <textarea rows="8" value={form.reviewText}
          onChange={(e) => update("reviewText", e.target.value)} required />

        <label>Poster image (max 3 MB){isEdit && currentPoster ? " — leave empty to keep the current one" : ""}</label>
        {isEdit && currentPoster && !poster && !removePoster && (
          <img src={currentPoster} alt="Current poster" className="poster-preview" />
        )}
        <input type="file" accept="image/*" onChange={(e) => setPoster(e.target.files[0] || null)} />
        {isEdit && currentPoster && !poster && (
          <label className="check">
            <input type="checkbox" checked={removePoster} onChange={(e) => setRemovePoster(e.target.checked)} />
            Remove the current poster
          </label>
        )}

        <label className="check">
          <input type="checkbox" checked={form.isMature}
            onChange={(e) => update("isMature", e.target.checked)} />
          Mature / explicit content (only 18+ users can read and comment)
        </label>

        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Publish review"}
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
