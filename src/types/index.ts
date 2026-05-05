import type { Feed, FeedEntry, FeedItem, Person } from "../bindings";

export type View =
  | { type: "empty" }
  | { type: "items"; feed: Feed; items: FeedItem[] }
  | { type: "entry"; feed: Feed; entry: FeedEntry };

export type UiError = {
  id: number;
  title: string;
  message: string;
};

export type { Feed, FeedItem, FeedEntry, Person };
