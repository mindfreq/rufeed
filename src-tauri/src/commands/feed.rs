
use cached::proc_macro::cached;

use crate::client::CLIENT;
use crate::config::feed_config::Feed;
use crate::parser::{extract_feed_info, FeedEntry, FeedItem};
use crate::Error;

// ======================= Feed Config Command =======================
#[tauri::command]
pub async fn add_feed(url: &str) -> Result<Feed, Error> {
    let html = CLIENT.get(url).send().await?.text().await?;

    let feeds = extract_feed_info(&html, url);

    match feeds.first() {
        Some(feed) => {
            let title = feed.title.as_deref().unwrap_or("Untitled Feed");
            let icon = feed.favicon.as_deref().unwrap_or("favicon.ico");
            Feed::add(title, &feed.url, &feed.feed_url, icon)
        }
        None => {
            return Err(Error::MissingField(
                "No RSS/Atom/JSON feed found at this URL".into(),
            ));
        }
    }
}

#[tauri::command]
pub async fn get_feeds() -> Result<Vec<Feed>, Error> {
    let feeds = Feed::get_all()?;
    Ok(feeds)
}

#[tauri::command]
pub async fn remove_feed(website_url: &str) -> Result<Feed, Error> {
    Ok(Feed::remove(website_url)?)
}
// =======================================================

#[tauri::command]
#[cached(size=100, time=300, result=true)]
pub async fn get_feed_item(website_url: String) -> Result<Vec<FeedItem>, Error> {
    
    if let Ok(feed) = Feed::get(&website_url) {
        let xml = CLIENT.get(&feed.feed_url).send().await?.text().await?;
        FeedItem::from_feed(&xml)
    } else {
        return Err(Error::MissingField("no feed found in the settings.".into()));
    }
}

#[tauri::command]
#[cached(size=100, time=300, result=true)]
pub async fn get_entry(website_url: String, target_url: String) -> Result<FeedEntry, Error> {
    if let Ok(feed) = Feed::get(&website_url) {
        let xml = CLIENT.get(&feed.feed_url).send().await?.text().await?;
        FeedEntry::from_feed(&xml, &target_url)
    } else {
        return Err(Error::MissingField("no feed found in the settings.".into()));
    }
}
