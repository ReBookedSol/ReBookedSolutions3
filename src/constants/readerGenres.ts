export const READER_GENRES = {
  FICTION: [
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "Thriller",
    "Romance",
    "Literary Fiction",
    "Historical Fiction",
    "Young Adult",
    "Children's Books",
    "Adventure",
    "Horror",
    "Dystopian",
    "Magical Realism",
    "Drama",
    "Humor/Comedy",
    "Other",
  ],
  NON_FICTION: [
    "Biography",
    "Autobiography",
    "History",
    "Science",
    "Self-Help",
    "Business",
    "Cooking",
    "Travel",
    "Art & Design",
    "Photography",
    "Poetry",
    "Essays",
    "Memoir",
    "True Crime",
    "Psychology",
    "Philosophy",
    "Religion & Spirituality",
    "Health & Wellness",
    "Other",
  ],
};

export const ALL_READER_GENRES = [
  ...READER_GENRES.FICTION,
  ...READER_GENRES.NON_FICTION,
].sort((a, b) => a.localeCompare(b));

export const GENRE_CATEGORIES = {
  Fiction: READER_GENRES.FICTION,
  "Non-Fiction": READER_GENRES.NON_FICTION,
};
