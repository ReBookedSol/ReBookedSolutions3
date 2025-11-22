-- Add genre column to books table for reader-type books
ALTER TABLE books
ADD COLUMN IF NOT EXISTS genre TEXT;

-- Add comment explaining the genre column
COMMENT ON COLUMN books.genre IS 'Genre classification for reader-type books (Fiction/Non-Fiction subgenres)';

-- Create index for genre filtering
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
