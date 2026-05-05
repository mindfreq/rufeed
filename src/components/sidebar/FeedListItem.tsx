import { memo } from "react";
import { Rss, Trash2 } from "lucide-react";
import { Feed } from "../../bindings";

interface FeedListItemProps {
  feed: Feed;
  isSelected: boolean;
  onSelect: (feed: Feed) => void;
  onRemove: (feed: Feed, e: React.MouseEvent) => void;
}

export const FeedListItem = memo(function FeedListItem({
  feed,
  isSelected,
  onSelect,
  onRemove,
}: FeedListItemProps) {
  return (
    <button
      onClick={() => onSelect(feed)}
      className={`group relative flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all duration-150 ${
        isSelected
          ? "border-border bg-card shadow-sm"
          : "border-transparent hover:border-border/60 hover:bg-card/60"
      }`}
    >
      {feed.icon ? (
        <img
          src={feed.icon}
          alt=""
          className="h-4 w-4 shrink-0 rounded-sm object-contain"
        />
      ) : (
        <Rss className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span dir="auto" className="min-w-0 flex-1 truncate font-medium">
        {feed.title || feed.url}
      </span>
      <span
        onClick={(e) => onRemove(feed, e)}
        role="button"
        aria-label="Remove feed"
        title="Remove feed"
        className="inline-flex items-center justify-center rounded-md p-1 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-3 w-3" />
      </span>
    </button>
  );
});
