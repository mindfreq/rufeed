use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::Error;

static CONFIG_PATH: OnceLock<PathBuf> = OnceLock::new();

pub fn init_config_path(app: &tauri::AppHandle) -> Result<(), String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;

    fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;

    let path = config_dir.join("feeds.json");
    CONFIG_PATH
        .set(path)
        .map_err(|_| "Config path already initialized".to_string())?;

    Ok(())
}

fn get_feeds_path() -> Result<&'static PathBuf, Error> {
    CONFIG_PATH
        .get()
        .ok_or_else(|| Error::MissingField("Config path not initialized".to_string()))
}

pub mod feed_config {
    use super::*;

    #[derive(Serialize, Deserialize, Debug)]
    pub struct Feed {
        pub id: String,
        pub title: String,
        pub url: String,
        pub feed_url: String,
        pub icon: String,
    }

    impl Feed {
        pub fn get(url: &str) -> Result<Feed, Error> {
            let feeds = Self::get_content()?;
            feeds
                .into_iter()
                .find(|feed| feed.url == url)
                .ok_or_else(|| Error::MissingField(format!("Feed with url '{}' not found", url)))
        }
        pub fn get_all() -> Result<Vec<Feed>, Error> {
            Self::get_content()
        }

        pub fn add(title: &str, url: &str, feed_url: &str, icon: &str) -> Result<Feed, Error> {
            let mut feeds = Self::get_content()?;

            // Prevent Duplicate
            feeds.retain(|feed| feed.url != url);

            let new_feed = Feed {
                id: uuid::Uuid::new_v4().to_string(),
                title: title.to_string(),
                url: url.to_string(),
                feed_url: feed_url.to_string(),
                icon: icon.to_string(),
            };
            feeds.push(new_feed);
            let json = serde_json::to_string_pretty(&feeds)?;
            fs::write(get_feeds_path()?, json)?;

            Ok(feeds.pop().unwrap())
        }

        pub fn remove(url: &str) -> Result<Feed, Error> {
            let mut feeds = Self::get_content()?;
            let index = feeds
                .iter()
                .position(|feed| feed.url == url)
                .ok_or_else(|| Error::MissingField(format!("Feed with url '{}' not found", url)))?;

            let removed = feeds.remove(index);
            let json = serde_json::to_string_pretty(&feeds)?;
            fs::write(get_feeds_path()?, json)?;

            Ok(removed)
        }

        fn get_content() -> Result<Vec<Feed>, Error> {
            let path = std::path::Path::new(get_feeds_path()?);
            if !path.exists() {
                fs::write(path, "[]")?;
            }

            let data = fs::read_to_string(path)?;
            Ok(serde_json::from_str(&data)?)
        }
    }
}
