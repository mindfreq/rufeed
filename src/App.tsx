import { useEffect, useRef, useState } from "react";
import { commands, Feed, FeedEntry, FeedItem, Person } from "./bindings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PlusCircle,
  Trash2,
  Rss,
  ExternalLink,
  ChevronLeft,
  RefreshCw,
  CircleAlert,
  X,
  Sun,
  Moon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type View =
  | { type: "empty" }
  | { type: "items"; feed: Feed; items: FeedItem[] }
  | {
      type: "entry";
      feed: Feed;
      items: FeedItem[];
      entry: FeedEntry;
      articleHtml: string;
      summaryMatchesContent: boolean;
    };

type UiError = {
  id: number;
  title: string;
  message: string;
};

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  return "Something went wrong. Please try again.";
};

const normalizeErrorMessage = (message: string): string => {
  const cleanedMessage = message.replace(/^Error:\s*/i, "").trim();
  if (cleanedMessage.toLowerCase().startsWith("missing required field:")) {
    return cleanedMessage.replace(/^missing required field:\s*/i, "");
  }

  return cleanedMessage;
};

const formatPublishedDate = (value?: string, long = false): string => {
  if (!value) return "Date unavailable";

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "Date unavailable";

  return new Date(timestamp).toLocaleDateString(undefined, long
    ? { year: "numeric", month: "long", day: "numeric" }
    : { year: "numeric", month: "short", day: "numeric" });
};

const getRenderableHtml = (content: string): string => {
  const value = content.trim();
  if (!value) return "";

  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(value);
  const hasEscapedTags = /&lt;\/?[a-z][\s\S]*&gt;/i.test(value);
  if (hasHtmlTags || !hasEscapedTags) return value;

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  const decoded = textarea.value.trim();

  return /<[a-z][\s\S]*>/i.test(decoded) ? decoded : value;
};

const getArticleHtml = (content: string): string => {
  const html = getRenderableHtml(content);
  if (!/<img[\s>]/i.test(html)) return html;

  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("img").forEach((image) => {
    if (!image.hasAttribute("loading")) image.setAttribute("loading", "lazy");
    if (!image.hasAttribute("decoding")) image.setAttribute("decoding", "async");
  });

  return template.innerHTML;
};

const isSummarySameAsContent = (summary: string | null, content: string): boolean => {
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

const normalizeAuthorUri = (value: string): string => {
  const cleanedValue = value.trim();
  if (!cleanedValue) return "";
  return /^https?:\/\//i.test(cleanedValue) ? cleanedValue : `https://${cleanedValue}`;
};

const getAuthorUriLabel = (value: string): string => {
  const normalized = normalizeAuthorUri(value);
  if (!normalized) return "Website";

  try {
    const url = new URL(normalized);
    return url.hostname.replace(/^www\./i, "") || "Website";
  } catch {
    return "Website";
  }
};

const renderAuthor = (author: Person, index: number) => {
  const normalizedUri = author.uri ? normalizeAuthorUri(author.uri) : "";

  return (
    <div
      key={`${author.name}-${index}`}
      className="flex flex-wrap items-center gap-2 rounded-md border border-border/70 bg-muted/40 px-2.5 py-1.5 text-xs"
    >
      <span className="font-medium text-foreground" dir="auto">{author.name}</span>
      {author.email && (
        <a
          href={`mailto:${author.email}`}
          className="text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
        >
          {author.email}
        </a>
      )}
      {normalizedUri && (
        <a
          href={normalizedUri}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-80"
        >
          {getAuthorUriLabel(normalizedUri)}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};

export default function App() {
  const { resolvedTheme, setTheme } = useTheme();
  const articleScrollRef = useRef<HTMLDivElement>(null);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [view, setView] = useState<View>({ type: "empty" });
  const [loadingView, setLoadingView] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [uiError, setUiError] = useState<UiError | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [feedPendingDelete, setFeedPendingDelete] = useState<Feed | null>(null);
  const [removingFeedId, setRemovingFeedId] = useState<number | null>(null);

  useEffect(() => {
    if (view.type !== "entry") return;
    articleScrollRef.current?.scrollTo({ top: 0 });
  }, [view.type === "entry" ? view.entry.url : null]);

  const showError = (error: unknown, fallbackMessage: string) => {
    console.error(error);
    const message = normalizeErrorMessage(extractErrorMessage(error)) || fallbackMessage;

    setUiError({
      id: Date.now(),
      title: "Action failed",
      message,
    });
  };

  useEffect(() => {
    if (!uiError) return;

    const timer = window.setTimeout(() => {
      setUiError((current) => (current?.id === uiError.id ? null : current));
    }, 5500);

    return () => window.clearTimeout(timer);
  }, [uiError]);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    setLoadingFeeds(true);
    try {
      const data = await commands.getFeeds();
      setFeeds(data);
    } catch (e) {
      showError(e, "Unable to load feeds right now.");
    } finally {
      setLoadingFeeds(false);
    }
  };

  const handleSelectFeed = async (feed: Feed) => {
    setIsMobileSidebarOpen(false);
    setSelectedFeed(feed);
    setLoadingView(true);
    setView({ type: "empty" });
    try {
      const items = await commands.getFeedItem(feed.url);
      setView({ type: "items", feed, items });
    } catch (e) {
      showError(e, "Unable to load feed items.");
    } finally {
      setLoadingView(false);
    }
  };

  const handleSelectItem = async (feed: Feed, item: FeedItem) => {
    setLoadingView(true);
    try {
      const entry = await commands.getEntry(feed.url, item.url);
      const items = view.type === "items" ? view.items : [];
      setView({
        type: "entry",
        feed,
        items,
        entry,
        articleHtml: getArticleHtml(entry.content),
        summaryMatchesContent: isSummarySameAsContent(entry.summary, entry.content),
      });
    } catch (e) {
      showError(e, "Unable to open this article.");
    } finally {
      setLoadingView(false);
    }
  };

  const handleBackToItems = () => {
    if (view.type !== "entry") return;
    setView({ type: "items", feed: view.feed, items: view.items });
  };

  const handleAddFeed = async () => {
    if (!addUrl.trim()) return;
    setAdding(true);
    try {
      const feed = await commands.addFeed(addUrl.trim());
      setFeeds((prev) => [...prev, feed]);
      setAddUrl("");
      setShowAddInput(false);
    } catch (e) {
      showError(e, "Unable to add this feed.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveFeed = async (feed: Feed) => {
    setRemovingFeedId(feed.id);
    try {
      await commands.removeFeed(feed.url);
      setFeeds((prev) => prev.filter((f) => f.id !== feed.id));
      if (selectedFeed?.id === feed.id) {
        setSelectedFeed(null);
        setView({ type: "empty" });
      }
      setFeedPendingDelete(null);
    } catch (e) {
      showError(e, "Unable to remove this feed.");
    } finally {
      setRemovingFeedId(null);
    }
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <Rss className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">RuFeed</span>
        </div>
        <div className="flex items-center gap-1.5 md:mr-8">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {resolvedTheme === "dark" ? "Switch to light" : "Switch to dark"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowAddInput((v) => !v)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add feed</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {showAddInput && (
        <div className="flex gap-2 border-b border-border/70 px-3 py-3">
          <input
            className="h-8 flex-1 rounded-md border border-border/80 bg-muted/50 px-2.5 text-xs outline-none transition-colors focus:border-primary"
            placeholder="https://..."
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddFeed()}
            autoFocus
          />
          <Button size="sm" className="h-8 px-3 text-xs" onClick={handleAddFeed} disabled={adding}>
            {adding ? "..." : "Add"}
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-1.5 p-2.5">
          {loadingFeeds ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 flex-1 rounded" />
              </div>
            ))
          ) : feeds.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 px-4 py-10 text-center text-xs text-muted-foreground">
              No feeds yet. Add one above.
            </div>
          ) : (
            feeds.map((feed) => (
              <button
                key={feed.id}
                onClick={() => handleSelectFeed(feed)}
                className={`group relative flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                  selectedFeed?.id === feed.id
                    ? "border-border bg-card shadow-sm"
                    : "border-transparent hover:border-border/70 hover:bg-card/60"
                }`}
              >
                {feed.icon ? (
                  <img src={feed.icon} alt="" className="h-4 w-4 rounded-sm object-contain shrink-0" />
                ) : (
                  <Rss className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span dir="auto" className="min-w-0 flex-1 truncate font-medium">
                  {feed.title || feed.url}
                </span>
                    <Tooltip>
                      <TooltipTrigger>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setFeedPendingDelete(feed);
                          }}
                          className="inline-flex items-center justify-center rounded-md p-1 align-middle opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </span>
                      </TooltipTrigger>
                  <TooltipContent>Remove feed</TooltipContent>
                </Tooltip>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border/70 px-4 py-3">
        <p className="text-xs text-muted-foreground">{feeds.length} feed{feeds.length !== 1 ? "s" : ""}</p>
      </div>
    </>
  );

  return (
    <TooltipProvider>
      <div className="relative flex h-screen overflow-hidden bg-background text-foreground">
        {/* Desktop sidebar */}
        <aside
          className={`relative hidden w-72 shrink-0 flex-col border-r border-border/70 bg-sidebar/80 backdrop-blur-sm ${
            isDesktopSidebarOpen ? "md:flex" : "md:hidden"
          }`}
        >
          <div className="absolute right-3 top-4 hidden md:block">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsDesktopSidebarOpen(false)}
              aria-label="Hide sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          </div>
          {sidebarContent}
        </aside>

        {!isDesktopSidebarOpen && (
          <div className="absolute left-4 top-4 z-50 hidden md:block">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm"
              onClick={() => setIsDesktopSidebarOpen(true)}
              aria-label="Show sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-72 max-w-[85vw] border-r border-border/70 bg-sidebar/80 p-0 backdrop-blur-sm"
          >
            <div className="flex h-full flex-col">{sidebarContent}</div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5 md:hidden select-none">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMobileSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span dir="auto" className="truncate text-sm font-medium tracking-tight">
              {selectedFeed?.title || selectedFeed?.url || "RuFeed"}
            </span>
          </div>

          {loadingView ? (
            <div className="flex-1 p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Separator />
                </div>
              ))}
            </div>
          ) : view.type === "empty" ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Rss className="h-10 w-10 opacity-20" />
              <p className="text-sm">{feeds.length === 0 ? "Add a feed to get started" : "Select a feed"}</p>
            </div>
          ) : view.type === "items" ? (
            <>
              <div className="flex items-center gap-2 border-b border-border/70 px-6 py-3.5">
                {view.feed.icon && (
                  <img src={view.feed.icon} alt="" className="h-5 w-5 rounded-sm object-contain" />
                )}
                <h1 dir="auto" className="font-semibold text-sm truncate">
                  {view.feed.title || view.feed.url}
                </h1>
                <a href={view.feed.url} target="_blank" rel="noreferrer" className="ml-auto">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </a>
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-2 p-3">
                  {view.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                      No items found.
                    </div>
                  ) : (
                    view.items.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectItem(view.feed, item)}
                        className="w-full select-none rounded-lg border border-transparent bg-card/40 px-4 py-3.5 text-left transition-all duration-200 hover:border-border/70 hover:bg-card hover:shadow-sm"
                      >
                        <p dir="auto" className="mb-1 line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatPublishedDate(item.published)}</p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          ) : view.type === "entry" ? (
            <>
              <div className="flex items-center gap-3 border-b border-border/70 bg-card/40 px-6 py-3.5 select-none">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleBackToItems}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-muted-foreground">{view.feed.title}</p>
                  <p dir="auto" className="truncate text-sm font-medium leading-5">{view.entry.title}</p>
                </div>
                <a href={view.entry.url} target="_blank" rel="noreferrer" className="ml-auto">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </a>
              </div>
              <div ref={articleScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <article className="mx-auto w-full max-w-3xl select-text px-4 py-7 sm:px-6 lg:px-8">
                  <h1 dir="auto" className="mb-3 text-2xl font-semibold leading-tight tracking-tight">
                    {view.entry.title}
                  </h1>
                  <div className="mb-6 space-y-2">
                    {view.entry.authors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {view.entry.authors.map((author, index) => renderAuthor(author, index))}
                      </div>
                    )}
                    {view.entry.published && (
                      <span className="text-xs text-muted-foreground">{formatPublishedDate(view.entry.published, true)}</span>
                    )}
                  </div>
                  {view.entry.summary && !view.summaryMatchesContent && (
                    <p className="mb-7 border-l-2 border-border pl-4 text-sm italic leading-6 text-muted-foreground">
                      {view.entry.summary}
                    </p>
                  )}
                  <div
                    className="reader-content prose prose-neutral prose-sm sm:prose-base break-words dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-7 prose-li:leading-7 prose-a:text-primary prose-a:no-underline prose-a:hover:underline prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground prose-img:rounded-lg prose-img:border [&_img]:max-w-full [&_pre]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: view.articleHtml }}
                  />
                </article>
              </div>
            </>
          ) : null}
        </main>

        {uiError && (
          <div className="pointer-events-none absolute right-4 top-4 z-[70] w-full max-w-sm">
            <div className="pointer-events-auto animate-in slide-in-from-top-2 fade-in-0 rounded-lg border border-destructive/30 bg-card p-3 shadow-lg duration-200">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-destructive/15 p-1.5 text-destructive">
                  <CircleAlert className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{uiError.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{uiError.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => setUiError(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {feedPendingDelete && (
          <div className="absolute inset-0 z-[65] flex items-center justify-center bg-background/55 px-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-xl border border-border/80 bg-card p-5 shadow-2xl">
              <div className="mb-3 flex items-start gap-3">
                <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold tracking-tight">Delete this feed?</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    This removes the feed from your sidebar and clears its articles from this app view.
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5">
                <p dir="auto" className="truncate text-xs font-medium text-foreground">
                  {feedPendingDelete.title || feedPendingDelete.url}
                </p>
                {feedPendingDelete.title && (
                  <p dir="auto" className="mt-0.5 truncate text-xs text-muted-foreground">
                    {feedPendingDelete.url}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFeedPendingDelete(null)}
                  disabled={removingFeedId === feedPendingDelete.id}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveFeed(feedPendingDelete)}
                  disabled={removingFeedId === feedPendingDelete.id}
                >
                  {removingFeedId === feedPendingDelete.id ? "Deleting..." : "Delete feed"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
