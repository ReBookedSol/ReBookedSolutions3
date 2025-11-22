-- Add item_type column to books table
ALTER TABLE books
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'textbook' NOT NULL;

-- Create an index for faster filtering by item_type
CREATE INDEX IF NOT EXISTS idx_books_item_type ON books(item_type);

-- Add constraint to ensure only valid values
ALTER TABLE books
ADD CONSTRAINT books_item_type_check CHECK (item_type IN ('textbook', 'reader'));

-- Add comment to document the column
COMMENT ON COLUMN books.item_type IS 'Type of book: textbook (school/university textbooks), reader (general novels/reading material)';
