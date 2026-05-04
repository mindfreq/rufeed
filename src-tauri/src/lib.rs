pub mod client;
pub mod commands;
pub mod config;
pub mod parser;

use commands::feed::{add_feed, get_entry, get_feed_item, get_feeds, remove_feed};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            config::init_config_path(app.handle())?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            add_feed,
            get_feeds,
            remove_feed,
            get_feed_item,
            get_entry
        ])
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

    #[error("The website returned unreadable response data")]
    InvalidResponseBody,

    #[error("The website returned status {status} for {url}")]
    HttpStatus { url: String, status: u16 },

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
