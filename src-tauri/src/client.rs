use once_cell::sync::Lazy;

pub static CLIENT: Lazy<reqwest::Client> = Lazy::new(|| {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .connect_timeout(std::time::Duration::from_secs(10))
        .user_agent("RuFeed/0.3")
        .build()
        .expect("Failed to build client")
});
