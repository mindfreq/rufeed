import { memo } from "react";
import { CircleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UiError } from "../types";

interface ErrorToastProps {
  error: UiError;
  onDismiss: () => void;
}

export const ErrorToast = memo(function ErrorToast({
  error,
  onDismiss,
}: ErrorToastProps) {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-[70] w-full max-w-sm">
      <div className="pointer-events-auto animate-in slide-in-from-top-2 fade-in-0 rounded-lg border border-destructive/30 bg-card p-3 shadow-lg duration-200">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-md bg-destructive/15 p-1.5 text-destructive">
            <CircleAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{error.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {error.message}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
});
