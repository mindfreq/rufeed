import { memo, useCallback, useState } from "react";
import {
  Moon,
  PanelLeftClose,
  PlusCircle,
  RefreshCw,
  Rss,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Feed } from "../../bindings";
import { AddFeedInput } from "./AddFeedInput";
import { FeedListItem } from "./FeedListItem";

interface SidebarContentProps {
  feeds: Feed[];
  loading: boolean;
  selectedFeedId?: string;
  onSelectFeed: (feed: Feed) => void;
  onRemoveFeed: (feed: Feed) => void;
  onAddFeed: (url: string) => Promise<void>;
  onRefresh: () => void;
  onHideSidebar?: () => void;
  showHideButton?: boolean;
}

export const SidebarContent = memo(function SidebarContent({
  feeds,
  loading,
  selectedFeedId,
  onSelectFeed,
  onRemoveFeed,
  onAddFeed,
  onRefresh,
  onHideSidebar,
  showHideButton = false,
}: SidebarContentProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [showAddInput, setShowAddInput] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const handleAdd = useCallback(async () => {
    if (!addUrl.trim()) return;
    setAdding(true);
    try {
      await onAddFeed(addUrl.trim());
      setAddUrl("");
      setShowAddInput(false);
    } finally {
      setAdding(false);
    }
  }, [addUrl, onAddFeed]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Rss className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">RuFeed</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleTheme}
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefresh}
            aria-label="Refresh feeds"
            title="Refresh feeds"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowAddInput((v) => !v)}
            aria-label="Add feed"
            title="Add feed"
          >
            <PlusCircle className="h-3.5 w-3.5" />
          </Button>

          {showHideButton && onHideSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onHideSidebar}
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Add feed input */}
      {showAddInput && (
        <AddFeedInput
          value={addUrl}
          adding={adding}
          onChange={setAddUrl}
          onAdd={handleAdd}
        />
      )}

      {/* Feed list */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-1 p-2.5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-lg border border-border/40 px-3 py-2.5"
              >
                <Skeleton className="h-4 w-4 rounded-sm" />
                <Skeleton className="h-3.5 flex-1 rounded" />
              </div>
            ))
          ) : feeds.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center text-xs text-muted-foreground">
              No feeds yet. Add one above.
            </div>
          ) : (
            feeds.map((feed) => (
              <FeedListItem
                key={feed.id}
                feed={feed}
                isSelected={selectedFeedId === feed.id}
                onSelect={onSelectFeed}
                onRemove={onRemoveFeed}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/70 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {feeds.length} feed{feeds.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
});
