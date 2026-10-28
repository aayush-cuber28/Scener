// Each content type has its own list of genres.
// Keep this in sync with frontend/src/genres.js
const GENRES = {
  movie: [
    "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
    "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller",
  ],
  song: [
    "Bollywood", "Classical", "EDM", "Hip-Hop", "Indie", "Jazz",
    "Lo-fi", "Metal", "Pop", "Punjabi", "R&B", "Rock",
  ],
  series: [
    "Anime", "Comedy", "Crime", "Documentary", "Drama", "Fantasy",
    "Horror", "Mystery", "Reality", "Romance", "Sci-Fi", "Thriller",
  ],
};

const CATEGORIES = Object.keys(GENRES);

function isValidCategory(category) {
  return CATEGORIES.includes(category);
}

// Accepts an array or a comma-separated string ("Action,Drama").
// Returns a clean list of genres, or null if any genre is not allowed for this category.
function cleanGenres(category, input) {
  if (input === undefined || input === null || input === "") return [];
  let list = Array.isArray(input) ? input : String(input).split(",");
  list = [...new Set(list.map((g) => String(g).trim()).filter(Boolean))];
  const allowed = GENRES[category] || [];
  if (list.some((g) => !allowed.includes(g))) return null;
  return list;
}

module.exports = { GENRES, CATEGORIES, isValidCategory, cleanGenres };
