
use feed_rs::parser;
use feed_rs::model::Person;


pub struct AtomSummary {
    title: String,
    published: String,
    url: String,
}

pub struct AtomFeed {   // For Home page
    entries: Vec<AtomSummary>
}


#[derive(Debug)]
pub struct AtomEntry {
    id: String,
    title: String,
    link: String,
    published: String,
    updated: String,
    summary: String,
    content: String,
    authors: Vec<Person>
}

impl AtomEntry {
    pub fn from_feed() -> Vec<Self>{
        let xml = std::fs::read_to_string("exam.atom").unwrap();
        let feed  = parser::parse(xml.as_bytes()).unwrap();
        
        let mut entries = Vec::new();

        for entry in feed.entries {
            let atom_entry = Self {
                id: entry.id,
                title: entry.title.map(|t| t.content).unwrap_or_default(),
                link: entry.links.iter()
                        .find(|l| l.rel.as_deref() == Some("alternate"))
                        .or_else(|| entry.links.first())
                        .map(|l| l.href.clone())
                        .unwrap_or_default(),
                published: entry.published.map(|d| d.to_string()).unwrap_or_default(),
                updated: entry.updated.map(|d| d.to_string()).unwrap_or_default(),
                summary: entry.summary.map(|t| t.content).unwrap_or_default(),
                content: entry.content.map(|c| c.body).flatten().unwrap_or_default(),
                authors: entry.authors,
            };
            entries.push(atom_entry);
        }
        entries
    }
}