/** Strip Discord user mentions from content. */
export function stripMention(content: string, userId: string): string {
  return content.replace(new RegExp(`<@!?${userId}>`, "g"), "").trim();
}

/** Truncate text with ellipsis for thread names. */
export function truncateThreadName(text: string, maxLen = 80): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= maxLen ? clean : clean.slice(0, maxLen - 1) + "…";
}
