import { memo, useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Feed, FeedItem } from "../../bindings";
import { FeedItemCard } from "./FeedItemCard";

interface FeedItemsListProps {
  feed: Feed;
  items: FeedItem[];
  loading: boolean;
  onSelectItem: (feed: Feed, item: FeedItem) => void;
}

export const FeedItemsList = memo(function FeedItemsList({
  feed,
  items,
  loading,
  onSelectItem,
}: FeedItemsListProps) {
  const handleItemClick = useCallback(
    (item: FeedItem) => {
      onSelectItem(feed, item);
    },
    [feed, onSelectItem]
  );

  return (
    <>
      {/* Feed header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border/70 px-5 py-3.5 select-none">
        {feed.icon && (
          <img
            src={feed.icon}
            alt=""
            className="h-5 w-5 shrink-0 rounded-sm object-contain"
          />
        )}
        <h1 dir="auto" className="min-w-0 flex-1 truncate text-sm font-semibold">
          {feed.title || feed.url}
        </h1>
        <a
          href={feed.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0"
          aria-label="Open feed source"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors hover:text-foreground" />
        </a>
      </div>

      {/* Items list */}
      <ScrollArea className="min-h-0 flex-1">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg bg-card/40 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
                {i < 5 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">No items found.</p>
          </div>
        ) : (
          <div className="space-y-1.5 p-3">
            {items.map((item, i) => (
              <FeedItemCard
                key={item.url || i}
                item={item}
                onClick={handleItemClick}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );
});
