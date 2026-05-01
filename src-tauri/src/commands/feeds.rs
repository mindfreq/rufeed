use crate::client::CLIENT;


async fn get_feed() {
    let rss = CLIENT.get("https://blog.rust-lang.org/feed").send().await.unwrap();
    println!("{}", res.body);
}