/**
 * Extracts a clean error message from unknown error types.
 */
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Something went wrong. Please try again.";
};

/**
 * Cleans up common error message prefixes.
 */
export const normalizeErrorMessage = (message: string): string => {
  const cleanedMessage = message.replace(/^Error:\s*/i, "").trim();
  if (cleanedMessage.toLowerCase().startsWith("missing required field:")) {
    return cleanedMessage.replace(/^missing required field:\s*/i, "");
  }
  return cleanedMessage;
};

/**
 * Formats a date string for display.
 */
export const formatPublishedDate = (value?: string, long = false): string => {
  if (!value) return "Date unavailable";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "Date unavailable";
  return new Date(timestamp).toLocaleDateString(undefined, long
    ? { year: "numeric", month: "long", day: "numeric" }
    : { year: "numeric", month: "short", day: "numeric" });
};

/**
 * Ensures HTML content is properly decoded and renderable.
 * Uses a cached textarea element to avoid repeated DOM creation.
 */
let _decodeTextarea: HTMLTextAreaElement | null = null;
const getDecodeTextarea = (): HTMLTextAreaElement => {
  if (!_decodeTextarea) {
    _decodeTextarea = document.createElement("textarea");
  }
  return _decodeTextarea;
};

export const getRenderableHtml = (content: string): string => {
  const value = content.trim();
  if (!value) return "";

  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(value);
  const hasEscapedTags = /&lt;\/?[a-z][\s\S]*&gt;/i.test(value);
  if (hasHtmlTags || !hasEscapedTags) return value;

  const textarea = getDecodeTextarea();
  textarea.innerHTML = value;
  const decoded = textarea.value.trim();

  return /<[a-z][\s\S]*>/i.test(decoded) ? decoded : value;
};

/**
 * Checks if a summary is effectively the same as the full content,
 * to avoid showing duplicate text.
 */
export const isSummarySameAsContent = (
  summary: string | null,
  content: string
): boolean => {
  if (!summary) return false;
  const normalizedSummary = summary.replace(/\s+/g, " ").trim();
  if (!normalizedSummary) return false;

  const htmlContent = getRenderableHtml(content);
  const normalizedHtml = htmlContent.replace(/\s+/g, " ").trim();
  if (normalizedSummary === normalizedHtml) return true;

  const textContent = htmlContent
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalizedSummary === textContent;
};

/**
 * Normalizes author URI to a valid URL string.
 */
export const normalizeAuthorUri = (value: string): string => {
  const cleanedValue = value.trim();
  if (!cleanedValue) return "";
  return /^https?:\/\//i.test(cleanedValue) ? cleanedValue : `https://${cleanedValue}`;
};

/**
 * Returns a human-readable label for an author URI.
 */
export const getAuthorUriLabel = (value: string): string => {
  const normalized = normalizeAuthorUri(value);
  if (!normalized) return "Website";
  try {
    const url = new URL(normalized);
    return url.hostname.replace(/^www\./i, "") || "Website";
  } catch {
    return "Website";
  }
};
