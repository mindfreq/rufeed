use crate::Error;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Serialize, Deserialize, Debug)]
struct Feed {
    id: String,
    title: String,
    url: String,
    icon: String,
}

impl Feed {
    fn get(url: &str) -> Result<Feed, Error> {
        let feeds = Self::get_content()?;
        feeds
            .into_iter()
            .find(|feed| feed.url == url)
            .ok_or_else(|| Error::MissingField(format!("Feed with url '{}' not found", url)))
    }
    fn get_all() -> Result<Vec<Feed>, Error> {
        Self::get_content()
    }

    fn add(title: String, url: String, icon: String) -> Result<Feed, Error> {
        let mut feeds = Self::get_content()?;
        let new_feed = Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            url,
            icon,
        };
        feeds.push(new_feed);
        let json = serde_json::to_string_pretty(&feeds)?;
        fs::write("feeds.json", json)?;

        Ok(feeds.pop().unwrap())
    }

    fn remove(url: &str) -> Result<Feed, Error> {
        let mut feeds = Self::get_content()?;
        let index = feeds.iter()
            .position(|feed| feed.url == url)
            .ok_or_else(|| Error::MissingField(format!("Feed with url '{}' not found", url)))?;

        let removed = feeds.remove(index);
        let json = serde_json::to_string_pretty(&feeds)?;
        fs::write("feeds.json", json)?;

        Ok(removed)
        
    }

    fn get_content() -> Result<Vec<Feed>, Error> {
        let path = std::path::Path::new("feeds.json");
        if !path.exists() {
            fs::write(path, "[]")?;
        }

        let data = fs::read_to_string(&path)?;
        Ok(serde_json::from_str(&data)?)
    }
}
