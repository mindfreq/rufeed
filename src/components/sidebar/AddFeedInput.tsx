import { memo, useRef } from "react";
import { Button } from "@/components/ui/button";

interface AddFeedInputProps {
  value: string;
  adding: boolean;
  onChange: (value: string) => void;
  onAdd: () => void;
}

export const AddFeedInput = memo(function AddFeedInput({
  value,
  adding,
  onChange,
  onAdd,
}: AddFeedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-2 border-b border-border/70 px-3 py-3">
      <input
        ref={inputRef}
        className="h-8 flex-1 rounded-md border border-border/80 bg-muted/50 px-2.5 text-xs outline-none transition-colors focus:border-primary focus:ring-0"
        placeholder="https://..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
        autoFocus
        disabled={adding}
        aria-label="Feed URL"
      />
      <Button
        size="sm"
        className="h-8 px-3 text-xs"
        onClick={onAdd}
        disabled={adding || !value.trim()}
      >
        {adding ? "Adding…" : "Add"}
      </Button>
    </div>
  );
});
