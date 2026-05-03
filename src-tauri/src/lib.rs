pub mod client;
pub mod commands;
pub mod config;
pub mod parser;

use commands::feed::{add_feed, get_entry, get_feeds, get_feed_item};

pub async fn test_thing() -> Result<(), Error> {
    match get_entry("https://blog.rust-lang.org/", "https://blog.rust-lang.org/2026/03/20/rust-challenges/").await {
        Ok(feed) => println!("{:?}", feed),
        Err(e) => eprintln!("add_feed failed: {}", e),
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![add_feed])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// =================== Error Handle ===================
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error("Failed to parse feed: {0}")]
    ParseFeed(#[from] feed_rs::parser::ParseFeedError),

    #[error("Missing required field: {0}")]
    MissingField(String),

    #[error("HTTP request failed: {0}")]
    HttpRequest(#[from] reqwest::Error),

    #[error("Failed to parse JSON: {0}")]
    Json(#[from] serde_json::Error),
}

// we must manually implement serde::Serialize
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
