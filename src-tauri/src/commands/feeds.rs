use crate::Error;

use crate::client::CLIENT;
use crate::parser::{FeedItemDetail, FeedItem};

pub async fn get_summaries() -> Result<Vec<FeedItem>, Error> {
    let xml = CLIENT
        .get("https://blog.rust-lang.org/feed")
        .send()
        .await?
        .text()
        .await?;
    let parser_xml = FeedItem::from_feed(&xml);
    println!("{:?}", parser_xml);
    parser_xml
}

pub async fn get_entry(taget_url: &str) -> Result<FeedItemDetail, Error> {
    let xml = CLIENT
        .get("https://blog.rust-lang.org/feed")
        .send()
        .await?
        .text()
        .await?;
    let parser_xml = FeedItemDetail::from_feed(&xml, taget_url);
    println!("{:?}", parser_xml);
    parser_xml
}
