import { useCallback, useState } from "react";
import { Menu, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFeeds } from "./hooks/useFeeds";
import { ArticleView } from "./components/article/ArticleView";
import { FeedItemsList } from "./components/feed/FeedItemsList";
import { SidebarContent } from "./components/sidebar/SidebarContent";
import { EmptyState } from "./components/EmptyState";
import { ErrorToast } from "./components/ErrorToast";
import { LoadingView } from "./components/LoadingView";
import { Feed, FeedItem } from "./bindings";

export default function App() {
  const {
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
  } = useFeeds();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const handleSelectFeed = useCallback(
    async (feed: Feed) => {
      setIsMobileSidebarOpen(false);
      await selectFeed(feed);
    },
    [selectFeed]
  );

  const handleSelectItem = useCallback(
    async (feed: Feed, item: FeedItem) => {
      await selectItem(feed, item);
    },
    [selectItem]
  );

  const handleAddFeed = useCallback(
    async (url: string) => {
      try {
        await addFeed(url);
      } catch (e) {
        showError(e, "Unable to add this feed.");
      }
    },
    [addFeed, showError]
  );

  const handleRemoveFeed = useCallback(
    async (feed: Feed, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await removeFeed(feed);
      } catch (err) {
        showError(err, "Unable to remove this feed.");
      }
    },
    [removeFeed, showError]
  );

  const sidebarProps = {
    feeds,
    loading: loadingFeeds,
    selectedFeedId: selectedFeed?.id,
    onSelectFeed: handleSelectFeed,
    onRemoveFeed: handleRemoveFeed,
    onAddFeed: handleAddFeed,
    onRefresh: loadFeeds,
  };

  return (
    <TooltipProvider>
      <div className="relative flex h-screen overflow-hidden bg-background text-foreground">

        {/* Desktop sidebar */}
        {isDesktopSidebarOpen && (
          <aside className="hidden w-72 shrink-0 flex-col border-r border-border/70 bg-sidebar/80 backdrop-blur-sm md:flex">
            <SidebarContent
              {...sidebarProps}
              showHideButton
              onHideSidebar={() => setIsDesktopSidebarOpen(false)}
            />
          </aside>
        )}

        {!isDesktopSidebarOpen && (
          <div className="absolute left-4 top-4 z-50 hidden md:block">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm"
              onClick={() => setIsDesktopSidebarOpen(true)}
              aria-label="Show sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Mobile sidebar */}
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-72 max-w-[85vw] border-r border-border/70 bg-sidebar/80 p-0 backdrop-blur-sm"
          >
            <SidebarContent {...sidebarProps} />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Mobile top bar */}
          <div className="flex shrink-0 items-center gap-2 border-b border-border/70 px-4 py-2.5 select-none md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMobileSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span dir="auto" className="min-w-0 flex-1 truncate text-sm font-medium tracking-tight">
              {selectedFeed?.title || selectedFeed?.url || "RuFeed"}
            </span>
          </div>

          {loadingView ? (
            <LoadingView />
          ) : view.type === "empty" ? (
            <EmptyState hasFeedsConfigured={feeds.length > 0} />
          ) : view.type === "items" ? (
            <FeedItemsList
              feed={view.feed}
              items={view.items}
              loading={false}
              onSelectItem={handleSelectItem}
            />
          ) : view.type === "entry" ? (
            <ArticleView
              feed={view.feed}
              entry={view.entry}
              onBack={handleSelectFeed}
            />
          ) : null}
        </main>

        {uiError && (
          <ErrorToast error={uiError} onDismiss={() => setUiError(null)} />
        )}
      </div>
    </TooltipProvider>
  );
}
