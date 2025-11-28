/**
 * Validates if a string is a valid UUID format (more lenient)
 */
export const isValidBookId = (id: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Safely extracts book ID from URL parameters
 */
export const extractBookId = (id: string | undefined): string | null => {
  if (!id) return null;
  if (!isValidBookId(id)) {
    return null;
  }
  return id;
};

/**
 * Debug book ID - logs validation info
 */
export const debugBookId = (id: string | undefined): void => {
  // Debug logging removed
};
