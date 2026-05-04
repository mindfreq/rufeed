import { invoke } from "@tauri-apps/api/core";

export type Feed = {
  id: string;
  title: string;
  url: string;
  feed_url: string;
  icon: string;
};

export type FeedItem = {
  title: string;
  published: string;
  url: string;
};

export type Person = {
  name: string;
  uri?: string;
  email?: string;
};

export type FeedEntry = {
  id: string;
  title: string;
  url: string;
  published: string;
  updated: string;
  summary: string | null;
  content: string;
  authors: Person[];
};

export type Error = string;

type TauriInvoke = <T>(
  command: string,
  args?: Record<string, unknown>,
) => Promise<T>;

const tauriInvoke: TauriInvoke = invoke;

export const commands = {
  addFeed: (url: string): Promise<Feed> =>
    tauriInvoke<Feed>("add_feed", { url }),

  getFeeds: (): Promise<Feed[]> =>
    tauriInvoke<Feed[]>("get_feeds"),

  removeFeed: (websiteUrl: string): Promise<Feed> =>
    tauriInvoke<Feed>("remove_feed", { websiteUrl: websiteUrl }),

  getFeedItem: (websiteUrl: string): Promise<FeedItem[]> =>
    tauriInvoke<FeedItem[]>("get_feed_item", { websiteUrl: websiteUrl }),

  getEntry: (websiteUrl: string, targetUrl: string): Promise<FeedEntry> =>
    tauriInvoke<FeedEntry>("get_entry", { websiteUrl: websiteUrl, targetUrl: targetUrl }),
};
