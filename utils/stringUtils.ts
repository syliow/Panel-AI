/**
 * Converts a string to Title Case (e.g., "software engineer" -> "Software Engineer").
 * Special handling for common abbreviations if they are already uppercase.
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  
  return str
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      
      // Preserve uppercase acronyms like AI, HR, CTO, etc.
      if (word === word.toUpperCase() && word.length > 1) {
          return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
