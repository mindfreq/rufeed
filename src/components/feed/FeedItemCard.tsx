import { memo } from "react";
import { FeedItem } from "../../bindings";
import { formatPublishedDate } from "../../utils";

interface FeedItemCardProps {
  item: FeedItem;
  onClick: (item: FeedItem) => void;
}

/**
 * Memoized card for a single feed item in the list.
 * Prevents re-rendering all cards when one item changes.
 */
export const FeedItemCard = memo(function FeedItemCard({
  item,
  onClick,
}: FeedItemCardProps) {
  return (
    <button
      onClick={() => onClick(item)}
      className="group w-full select-none rounded-lg border border-transparent bg-card/40 px-4 py-3.5 text-left transition-all duration-150 hover:border-border/70 hover:bg-card hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p
        dir="auto"
        className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground"
      >
        {item.title}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatPublishedDate(item.published)}
      </p>
    </button>
  );
});
