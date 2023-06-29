export function slugify(str) {
  // Remove query string

  const queryStringIndex = str.indexOf("?");
  if (queryStringIndex !== -1) {
    str = str.slice(0, queryStringIndex);
  }

  const slug = str
    .replace(/^(https?:\/\/)/i, "") // Remove "https://" or "http://"
    .replace(/[./]/g, "-") // Replace dots and slashes with hyphens
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric characters
    .replace(/\s+/g, "-") // Replace whitespace with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .trim(); // Trim leading/trailing whitespace

  // Trim hyphens from start and end of slug

  return slug.replace(/^-+|-+$/g, "");
}
