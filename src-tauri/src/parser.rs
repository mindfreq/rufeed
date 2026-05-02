use feed_rs::model::Person;
use feed_rs::parser;
use scraper::{Html, Selector};

use crate::Error;


#[derive(Debug)]
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
                    .map(|d| d.to_string())
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


#[derive(Debug)]
pub struct FeedItemDetail {
    pub id: String,
    pub title: String,
    pub url: String,
    pub published: String,
    pub updated: String,
    pub summary: Option<String>,
    pub content: String,
    pub authors: Vec<Person>,
}

impl FeedItemDetail {
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
                        .map(|d| d.to_string())
                        .ok_or(Error::MissingField("published".into()))?,
                    updated: entry
                        .updated
                        .map(|d| d.to_string())
                        .ok_or(Error::MissingField("updated".into()))?,
                    summary: entry.summary.map(|t| t.content),
                    content: entry
                        .content
                        .and_then(|c| c.body)
                        .ok_or(Error::MissingField("content".into()))?,
                    authors: entry.authors,
                });
            }
        }

        Err(Error::MissingField(
            format!("no entry found for url: {}", target_url)
        ))
    }
}



pub fn extract_feed_urls(html: &str) -> Vec<String> {
    let document = Html::parse_document(html);
    
    let selector = Selector::parse(
        r#"link[rel="alternate"][type="application/rss+xml"],
           link[rel="alternate"][type="application/atom+xml"],
           link[rel="alternate"][type="application/feed+json"]"#
    ).unwrap();

    document
        .select(&selector)
        .filter_map(|el| el.value().attr("href"))
        .map(|href| href.to_string())
        .collect()
}