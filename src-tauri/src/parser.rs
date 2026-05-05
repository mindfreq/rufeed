use feed_rs::model::Person;
use feed_rs::parser;
use scraper::{Html, Selector};

use crate::Error;

#[derive(Debug, Clone, serde::Serialize)]
pub struct FeedItem {
    pub title: String,
    pub published: String,
    pub url: String,
}

impl FeedItem {
    pub fn from_feed(xml: &str) -> Result<Vec<Self>, Error> {
        let feed = parser::parse(xml.as_bytes())?;
        let mut items: Vec<Self> = Vec::new();

        for entry in feed.entries {
            let item = Self {
                title: entry
                    .title
                    .map(|t| t.content)
                    .ok_or(Error::MissingField("title".into()))?,
                published: entry
                    .published
                    .or(entry.updated)
                    .map(|d| d.to_rfc3339())
                    .ok_or(Error::MissingField("published".into()))?,
                url: entry
                    .links
                    .iter()
                    .find(|l| l.rel.as_deref() == Some("alternate"))
                    .or_else(|| entry.links.first())
                    .map(|l| l.href.clone())
                    .ok_or(Error::MissingField("url".into()))?,
            };
            items.push(item);
        }
        Ok(items)
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FeedEntry {
    pub id: String,
    pub title: String,
    pub url: String,
    pub published: String,
    pub updated: String,
    pub summary: Option<String>,
    pub content: String,
    pub authors: Vec<Person>,
}

impl FeedEntry {
    pub fn from_feed(xml: &str, target_url: &str) -> Result<Self, Error> {
        let feed = parser::parse(xml.as_bytes())?;

        for entry in feed.entries {
            let url = entry
                .links
                .iter()
                .find(|l| l.rel.as_deref() == Some("alternate"))
                .or_else(|| entry.links.first())
                .map(|l| l.href.clone())
                .unwrap_or_default();

            if url == target_url {
                let summary = entry.summary.map(|t| t.content);
                let content = entry
                    .content
                    .and_then(|c| c.body)
                    .or_else(|| summary.clone())
                    .ok_or(Error::MissingField("content".into()))?;

                return Ok(Self {
                    id: entry.id,
                    title: entry
                        .title
                        .map(|t| t.content)
                        .ok_or(Error::MissingField("title".into()))?,
                    url,
                    published: entry
                        .published
                        .or(entry.updated)
                        .map(|d| d.to_rfc3339())
                        .ok_or(Error::MissingField("published".into()))?,
                    updated: entry
                        .updated
                        .or(entry.published)
                        .map(|d| d.to_rfc3339())
                        .ok_or(Error::MissingField("updated".into()))?,
                    summary,
                    content,
                    authors: entry
                        .authors
                        .into_iter()
                        .map(|author| Person {
                            name: author.name,
                            uri: author.uri,
                            email: author.email,
                        })
                        .collect(),
                });
            }
        }

        Err(Error::MissingField(format!(
            "no entry found for url: {}",
            target_url
        )))
    }
}

#[derive(Debug, Clone)]
pub struct FeedInfo {
    pub url: String,
    pub feed_url: String,
    pub title: Option<String>,
    pub favicon: Option<String>,
}

pub fn extract_feed_info(html: &str, base_url: &str) -> Vec<FeedInfo> {
    let document = Html::parse_document(html);

    let rss_selector =
        Selector::parse(r#"link[rel="alternate"][type="application/rss+xml"]"#).unwrap();
    let atom_selector =
        Selector::parse(r#"link[rel="alternate"][type="application/atom+xml"]"#).unwrap();
    let json_selector =
        Selector::parse(r#"link[rel="alternate"][type="application/feed+json"]"#).unwrap();

    let favicon = extract_favicon(&document, base_url);

    let mut feeds: Vec<FeedInfo> = Vec::new();

    for selector in [&rss_selector, &atom_selector, &json_selector] {
        for el in document.select(selector) {
            if let Some(href) = el.value().attr("href") {
                let title = el.value().attr("title").map(String::from);

                feeds.push(FeedInfo {
                    url: base_url.to_string(),
                    feed_url: resolve_url(base_url, href),
                    title,
                    favicon: favicon.clone(),
                });
            }
        }
    }

    feeds
}

fn extract_favicon(document: &Html, base_url: &str) -> Option<String> {
    // ترتيب الأولوية: Apple Touch Icon -> PNG Icon -> Standard Icon -> favicon.ico
    let favicon_selectors = [
        r#"link[rel="apple-touch-icon"]"#,
        r#"link[rel="apple-touch-icon-precomposed"]"#,
        r#"link[rel="icon"][type="image/png"]"#,
        r#"link[rel="icon"][sizes="32x32"]"#,
        r#"link[rel="icon"][sizes="any"]"#,
        r#"link[rel="icon"]"#,
        r#"link[rel="shortcut icon"]"#,
    ];

    for selector_str in &favicon_selectors {
        if let Ok(sel) = Selector::parse(selector_str) {
            if let Some(el) = document.select(&sel).next() {
                if let Some(href) = el.value().attr("href") {
                    return Some(resolve_url(base_url, href));
                }
            }
        }
    }

    Some(format!("{}/favicon.ico", base_url.trim_end_matches('/')))
}

fn resolve_url(base: &str, href: &str) -> String {
    if href.starts_with("http://") || href.starts_with("https://") {
        href.to_string()
    } else if href.starts_with("//") {
        format!("https:{}", href)
    } else if href.starts_with('/') {
        // رابط مطلق نسبي
        let base = base.strip_suffix('/').unwrap_or(base);
        
        format!("{}{}", base, href)
    } else {
        // رابط نسبي
        let base = if base.ends_with('/') {
            base.to_string()
        } else {
            format!("{}/", base)
        };
        format!("{}{}", base, href)
    }
}
