import { useCallback, useEffect, useState } from "react";
import { commands, Feed, FeedItem } from "../bindings";
import { UiError, View } from "../types";
import { extractErrorMessage, normalizeErrorMessage } from "../utils";

const DIRECT_FEED_PATH_PATTERN = /(feed|rss|atom)(\.[a-z0-9]+)?$/i;
const DIRECT_FEED_EXTENSION_PATTERN = /\.(rss|xml|atom|rdf|json)$/i;

const isLikelyDirectFeedUrl = (value: string): boolean => {
  try {
    const { pathname } = new URL(value);
    const normalizedPath = pathname.toLowerCase();
    return (
      DIRECT_FEED_PATH_PATTERN.test(normalizedPath) ||
      DIRECT_FEED_EXTENSION_PATTERN.test(normalizedPath)
    );
  } catch {
    return false;
  }
};

export function useFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [view, setView] = useState<View>({ type: "empty" });
  const [loadingView, setLoadingView] = useState(false);
  const [uiError, setUiError] = useState<UiError | null>(null);

  const showError = useCallback((error: unknown, fallbackMessage: string) => {
    console.error(error);
    const message = normalizeErrorMessage(extractErrorMessage(error)) || fallbackMessage;
    setUiError({ id: Date.now(), title: "Action failed", message });
  }, []);

  // Auto-dismiss error after 5.5 seconds
  useEffect(() => {
    if (!uiError) return;
    const timer = window.setTimeout(() => {
      setUiError((current) => (current?.id === uiError.id ? null : current));
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [uiError]);

  const loadFeeds = useCallback(async () => {
    setLoadingFeeds(true);
    try {
      const data = await commands.getFeeds();
      setFeeds(data);
    } catch (e) {
      showError(e, "Unable to load feeds right now.");
    } finally {
      setLoadingFeeds(false);
    }
  }, [showError]);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  const selectFeed = useCallback(
    async (feed: Feed) => {
      setSelectedFeed(feed);
      setLoadingView(true);
      setView({ type: "empty" });
      try {
        const items = await commands.getFeedItem(feed.url);
        setView({ type: "items", feed, items });
      } catch (e) {
        showError(e, "Unable to load feed items.");
      } finally {
        setLoadingView(false);
      }
    },
    [showError]
  );

  const selectItem = useCallback(
    async (feed: Feed, item: FeedItem) => {
      setLoadingView(true);
      try {
        const entry = await commands.getEntry(feed.url, item.url);
        setView({ type: "entry", feed, entry });
      } catch (e) {
        showError(e, "Unable to open this article.");
      } finally {
        setLoadingView(false);
      }
    },
    [showError]
  );

  const addFeed = useCallback(
    async (url: string) => {
      const normalizedUrl = url.trim();
      const feed = isLikelyDirectFeedUrl(normalizedUrl)
        ? await commands.addFeedDirect(normalizedUrl)
        : await commands.addFeed(normalizedUrl);
      setFeeds((prev) => [...prev, feed]);
      return feed;
    },
    []
  );

  const removeFeed = useCallback(
    async (feed: Feed) => {
      await commands.removeFeed(feed.url);
      setFeeds((prev) => prev.filter((f) => f.id !== feed.id));
      if (selectedFeed?.id === feed.id) {
        setSelectedFeed(null);
        setView({ type: "empty" });
      }
    },
    [selectedFeed]
  );

  return {
    feeds,
    loadingFeeds,
    selectedFeed,
    view,
    loadingView,
    uiError,
    setUiError,
    loadFeeds,
    selectFeed,
    selectItem,
    addFeed,
    removeFeed,
    showError,
  };
}
