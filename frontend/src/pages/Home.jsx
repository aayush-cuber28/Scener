import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { GENRES, CATEGORY_PLURALS, CATEGORY_ICONS } from "../genres";

const TABS = ["all", "movie", "song", "series"];

export default function Home() {
  const { auth } = useAuth();
  const token = auth?.token;
  const [titles, setTitles] = useState([]);
  const [category, setCategory] = useState("all");
  const [genre, setGenre] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wait until the user stops typing before searching.
  useEffect(() => {
    const value = searchInput.trim();
    if (value === search) return;
    const timer = setTimeout(() => {
      setLoading(true);
      setSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (genre) params.set("genre", genre);
    if (search) params.set("search", search);
    if (sort !== "latest") params.set("sort", sort);
    const query = params.toString() ? `?${params}` : "";

    let ignore = false;
    api(`/titles${query}`, { token })
      .then((data) => {
        if (ignore) return;
        setTitles(data);
        setError("");
      })
      .catch((e) => !ignore && setError(e.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [category, genre, search, sort, token]);

  function pickCategory(tab) {
    if (tab === category) return;
    setCategory(tab);
    setGenre("");
    setLoading(true);
  }

  function pickGenre(value) {
    if (value === genre) return;
    setGenre(value);
    setLoading(true);
  }

  const heading =
    category === "all" ? "Latest reviews" : `${CATEGORY_PLURALS[category]}${genre ? ` · ${genre}` : ""}`;

  return (
    <>
      <div className="home-head">
        <h1>{heading}</h1>
        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder="Search by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            className="sort"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setLoading(true);
            }}
          >
            <option value="latest">Newest first</option>
            <option value="rating">Top rated</option>
            <option value="name">A to Z</option>
          </select>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={tab === category ? "tab active" : "tab"}
            onClick={() => pickCategory(tab)}
          >
            {tab === "all" ? "All" : `${CATEGORY_ICONS[tab]} ${CATEGORY_PLURALS[tab]}`}
          </button>
        ))}
      </div>

      {category !== "all" && (
        <div className="chips">
          <button className={genre === "" ? "chip active" : "chip"} onClick={() => pickGenre("")}>
            All genres
          </button>
          {GENRES[category].map((g) => (
            <button key={g} className={genre === g ? "chip active" : "chip"} onClick={() => pickGenre(g)}>
              {g}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && titles.length === 0 && (
        <div className="empty-state">
          <p className="muted">
            {search || genre ? "Nothing matches your filters." : "No reviews here yet."}
          </p>
        </div>
      )}

      <div className="grid">
        {titles.map((t) => (
          <Link to={`/title/${t._id}`} className="card" key={t._id}>
            <div className="poster-wrap">
              {t.poster ? (
                <img className={t.locked ? "poster blurred" : "poster"} src={t.poster} alt={t.name} loading="lazy" />
              ) : (
                <div className="poster poster-empty">{CATEGORY_ICONS[t.category] || "🎬"}</div>
              )}
              {t.isMature && <span className="badge badge-corner">18+</span>}
            </div>
            <div className="card-body">
              <div className="card-title">{t.name}</div>
              <div className="card-meta">
                {t.category} {t.year ? `• ${t.year}` : ""}
              </div>
              {t.genres?.length > 0 && <div className="card-genres">{t.genres.join(" · ")}</div>}
              <div className="rating">⭐ {t.rating.toFixed(1)}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
