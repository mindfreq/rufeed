import { memo, useCallback, useState, type MouseEvent } from "react";
import { Check, Rss, Trash2, X } from "lucide-react";
import { Feed } from "../../bindings";

interface FeedListItemProps {
  feed: Feed;
  isSelected: boolean;
  onSelect: (feed: Feed) => void;
  onRemove: (feed: Feed) => void;
}

export const FeedListItem = memo(function FeedListItem({
  feed,
  isSelected,
  onSelect,
  onRemove,
}: FeedListItemProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleToggleDeleteConfirm = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete((value) => !value);
  }, []);

  const handleCancelDelete = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  }, []);

  const handleConfirmDelete = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onRemove(feed);
      setIsConfirmingDelete(false);
    },
    [feed, onRemove]
  );

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
      {isConfirmingDelete ? (
        <span className="inline-flex items-center gap-1">
          <span
            onClick={handleConfirmDelete}
            role="button"
            aria-label="Confirm removing feed"
            title="Confirm remove"
            className="inline-flex items-center gap-1 rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive transition-all hover:bg-destructive/20"
          >
            <Check className="h-3 w-3" />
            Confirm
          </span>
          <span
            onClick={handleCancelDelete}
            role="button"
            aria-label="Cancel removing feed"
            title="Cancel remove"
            className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </span>
        </span>
      ) : (
        <span
          onClick={handleToggleDeleteConfirm}
          role="button"
          aria-label="Remove feed"
          title="Remove feed"
          className="inline-flex items-center justify-center rounded-md p-1 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </span>
      )}
    </button>
  );
});
