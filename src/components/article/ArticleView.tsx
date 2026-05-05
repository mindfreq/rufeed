import { memo, useMemo } from "react";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Feed, FeedEntry } from "../../bindings";
import { formatPublishedDate, getRenderableHtml, isSummarySameAsContent } from "../../utils";
import { AuthorTag } from "./AuthorTag";

interface ArticleViewProps {
  feed: Feed;
  entry: FeedEntry;
  onBack: (feed: Feed) => void;
}

/**
 * ArticleView renders the full article content.
 *
 * Performance optimizations:
 * 1. `memo` prevents re-render when parent re-renders with same props.
 * 2. `useMemo` for HTML processing — getRenderableHtml runs only when entry.content changes,
 *    not on every scroll/hover event.
 * 3. `useMemo` for summary check — isSummarySameAsContent is a string-comparison operation
 *    that only needs to re-run when summary or content changes.
 * 4. The heavy `dangerouslySetInnerHTML` div only re-renders when `renderedHtml` changes.
 */
export const ArticleView = memo(function ArticleView({
  feed,
  entry,
  onBack,
}: ArticleViewProps) {
  // Memoize HTML processing — avoids re-running on every scroll event
  const renderedHtml = useMemo(
    () => getRenderableHtml(entry.content),
    [entry.content]
  );

  const showSummary = useMemo(
    () =>
      Boolean(entry.summary) &&
      !isSummarySameAsContent(entry.summary, entry.content),
    [entry.summary, entry.content]
  );

  const formattedDate = useMemo(
    () => formatPublishedDate(entry.published, true),
    [entry.published]
  );

  return (
    <>
      {/* Article toolbar */}
      <div className="flex items-center gap-3 border-b border-border/70 bg-card/40 px-4 py-3 select-none shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onBack(feed)}
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {feed.title || feed.url}
        </span>
        <a
          href={entry.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0"
          aria-label="Open original article"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors hover:text-foreground" />
        </a>
      </div>

      {/* Scrollable article body — native scroll for best performance */}
      <ScrollArea className="min-h-0 flex-1">
        <article className="mx-auto w-full max-w-2xl select-text px-5 py-8 sm:px-8">
          {/* Title */}
          <h1
            dir="auto"
            className="mb-4 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl"
          >
            {entry.title}
          </h1>

          {/* Meta: authors + date */}
          <div className="mb-6 space-y-3">
            {entry.authors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {entry.authors.map((author, index) => (
                  <AuthorTag key={`${author.name}-${index}`} author={author} index={index} />
                ))}
              </div>
            )}
            {entry.published && (
              <time
                dateTime={entry.published}
                className="block text-xs text-muted-foreground"
              >
                {formattedDate}
              </time>
            )}
          </div>

          {/* Summary / lead paragraph */}
          {showSummary && entry.summary && (
            <p className="mb-8 border-l-2 border-primary/50 pl-4 text-sm italic leading-7 text-muted-foreground">
              {entry.summary}
            </p>
          )}

          {/* Article HTML content */}
          <div
            className="reader-content prose prose-neutral prose-sm sm:prose-base max-w-none break-words dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-7 prose-li:leading-7 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground prose-img:rounded-lg prose-img:border [&_img]:max-w-full [&_pre]:max-w-full"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </article>
      </ScrollArea>
    </>
  );
});
