import { memo } from "react";
import { ExternalLink } from "lucide-react";
import { Person } from "../../bindings";
import { getAuthorUriLabel, normalizeAuthorUri } from "../../utils";

interface AuthorTagProps {
  author: Person;
  index: number;
}

export const AuthorTag = memo(function AuthorTag({ author, index }: AuthorTagProps) {
  const normalizedUri = author.uri ? normalizeAuthorUri(author.uri) : "";

  return (
    <div
      key={`${author.name}-${index}`}
      className="flex flex-wrap items-center gap-2 rounded-md border border-border/70 bg-muted/40 px-2.5 py-1.5 text-xs"
    >
      <span className="font-medium text-foreground" dir="auto">
        {author.name}
      </span>
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
});
