import { memo } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export const LoadingView = memo(function LoadingView() {
  return (
    <div className="flex-1 space-y-4 overflow-hidden p-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
          {i < 5 && <Separator className="mt-1" />}
        </div>
      ))}
    </div>
  );
});
