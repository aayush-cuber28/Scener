// Keep this in sync with backend/src/utils/genres.js
export const GENRES = {
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

export const CATEGORY_LABELS = { movie: "Movie", song: "Song", series: "Series" };
export const CATEGORY_PLURALS = { movie: "Movies", song: "Songs", series: "Series" };
export const CATEGORY_ICONS = { movie: "🎬", song: "🎵", series: "📺" };
