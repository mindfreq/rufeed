use cached::proc_macro::cached;
use feed_rs::parser;
use reqwest::header::{ACCEPT, ACCEPT_ENCODING};

use crate::client::CLIENT;
use crate::config::feed_config::Feed;
use crate::parser::{extract_feed_info, FeedEntry, FeedItem};
use crate::Error;

async fn fetch_text(url: &str, accept: &str) -> Result<String, Error> {
    let response = CLIENT
        .get(url)
        .header(ACCEPT, accept)
        .header(ACCEPT_ENCODING, "identity")
        .send()
        .await?;

    let status = response.status();
    if !status.is_success() {
        return Err(Error::HttpStatus {
            url: url.to_string(),
            status: status.as_u16(),
        });
    }

    response.text().await.map_err(|error| {
        if error.is_decode() {
            Error::InvalidResponseBody
        } else {
            Error::HttpRequest(error)
        }
    })
}

// ======================= Feed Config Command =======================
#[tauri::command]
pub async fn add_feed(url: &str) -> Result<Feed, Error> {
    let html = fetch_text(url, "text/html,*/*;q=0.8").await?;

    let feeds = extract_feed_info(&html, url);

    match feeds.first() {
        Some(feed) => {
            let title = feed.title.as_deref().unwrap_or("Untitled Feed");
            let icon = feed.favicon.as_deref().unwrap_or("favicon.ico");
            Feed::add(title, &feed.url, &feed.feed_url, icon)
        }
        None => Err(Error::MissingField(
            "No RSS/Atom/JSON feed found at this URL".into(),
        )),
    }
}

#[tauri::command]
pub async fn add_feed_direct(feed_url: &str) -> Result<Feed, Error> {
    // This function for full path, eg: 'https://blog.rust-lang.org/feed'
    //
    let xml = fetch_text(
        feed_url,
        "application/rss+xml,application/atom+xml,application/xml,text/xml,*/*;q=0.8",
    )
    .await?;

    let feed = parser::parse(xml.as_bytes())?;

    let title = feed.title.map(|t| t.content).unwrap_or("no title".into());
    let url = url::Url::parse(feed_url)
        .unwrap()
        .origin()
        .ascii_serialization();

    let icon = feed
        .icon
        .map(|i| i.uri)
        .unwrap_or(format!("{url}/favicon.ico"));
    Feed::add(&title, &url, feed_url, &icon)
}

#[tauri::command]
pub async fn get_feeds() -> Result<Vec<Feed>, Error> {
    let feeds = Feed::get_all()?;
    Ok(feeds)
}

#[tauri::command]
pub async fn remove_feed(website_url: &str) -> Result<Feed, Error> {
    Feed::remove(website_url)
}
// =======================================================

#[tauri::command]
#[cached(size = 100, time = 300, result = true)]
pub async fn get_feed_item(website_url: String) -> Result<Vec<FeedItem>, Error> {
    if let Ok(feed) = Feed::get(&website_url) {
        let xml = fetch_text(
            &feed.feed_url,
            "application/rss+xml,application/atom+xml,application/xml,text/xml,*/*;q=0.8",
        )
        .await?;
        FeedItem::from_feed(&xml)
    } else {
        Err(Error::MissingField("no feed found in the settings.".into()))
    }
}

#[tauri::command]
#[cached(size = 100, time = 300, result = true)]
pub async fn get_entry(website_url: String, target_url: String) -> Result<FeedEntry, Error> {
    if let Ok(feed) = Feed::get(&website_url) {
        let xml = fetch_text(
            &feed.feed_url,
            "application/rss+xml,application/atom+xml,application/xml,text/xml,*/*;q=0.8",
        )
        .await?;

        FeedEntry::from_feed(&xml, &target_url)
    } else {
        Err(Error::MissingField("no feed found in the settings.".into()))
    }
}
