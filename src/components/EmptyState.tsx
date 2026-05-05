import { memo } from "react";
import { Rss } from "lucide-react";

interface EmptyStateProps {
  hasFeedsConfigured: boolean;
}

export const EmptyState = memo(function EmptyState({
  hasFeedsConfigured,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
      <Rss className="h-10 w-10 opacity-20" />
      <p className="text-sm">
        {hasFeedsConfigured ? "Select a feed to read" : "Add a feed to get started"}
      </p>
    </div>
  );
});
