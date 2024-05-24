use regex::{Captures, Regex};
use once_cell::sync::Lazy;

#[derive(Debug)]
pub struct Token {
    pub value: String,
    pub position: usize
}

static COMMENT_REG: Lazy<Regex> = Lazy::new(|| Regex::new(r"#.+").unwrap());

static PRESERVE_IN_STRING: [char; 4] = ['(',')','#',','];
static PRESERVE_REG: Lazy<Regex> = Lazy::new(|| Regex::new(r"[\(\)#,]").unwrap());

static STRING_REG: Lazy<Regex> = Lazy::new(|| Regex::new("\".*?\"").unwrap());
static TOKEN_REG:  Lazy<Regex> = Lazy::new(|| Regex::new("(?m)\"[^\"]*\"|^:\\w+|[^\\s\"\\[\\](){}:]+").unwrap());

/// Splits a given text input into tokens.
/// Note this does not preserve brackets and so the tokens are not in order of execution.
pub fn parse(inp_doc: &str) -> Vec<Token> {
    let mut document = inp_doc.to_owned();

    // Temporarily replace characters such as # in strings with __i__
    let is_preserved = preserve_string(&mut document);

    // Replace comments with whitespace, retaining character offsets
    document = COMMENT_REG.replace_all(&document, |caps: &Captures| {
        " ".repeat(caps[0].len())
    }).to_string();

    if is_preserved {
        unpreserve_string(&mut document);
    }

    tokenise(&document)
}

fn preserve_string(document: &mut String) -> bool {
    let mut required = false;
    let mut doc_clone = document.to_owned();

    for str_match in STRING_REG.find_iter(document) {
        if !PRESERVE_REG.is_match(str_match.into()) { continue; }
        required = true;

        let mut replaced_by: String = str_match.as_str().to_string();

        for (i, preserve) in PRESERVE_IN_STRING.iter().enumerate() {
            replaced_by = replaced_by.replace(*preserve, &format!("__{i}__"));
        }

        doc_clone = doc_clone.replace(str_match.as_str(), &replaced_by);
    }

    *document = doc_clone;
    required
}

fn unpreserve_string(document: &mut String) {
    let mut doc_clone: String = document.to_owned();

    for str_match in STRING_REG.find_iter(document) {
        let mut replaced_by = str_match.as_str().to_string();
        
        for (i, preserve) in PRESERVE_IN_STRING.iter().enumerate() {
            replaced_by = replaced_by.replace(&format!("__{i}__"), preserve.to_string().as_str());
        }

        doc_clone = doc_clone.replace(str_match.as_str(), &replaced_by);
    }

    *document = doc_clone;
}

fn tokenise(document: &str) -> Vec<Token> {
    TOKEN_REG.find_iter(document)
        .map(|t| {
            Token {
                value: replace_commas_not_in_str(t.as_str()),
                position: t.start()
            }
        })
        .filter(|t| !t.value.is_empty())
        .collect()
}

fn replace_commas_not_in_str(token: &str) -> String {
    if !token.starts_with('"') {
        return token.replace(r",", "");
    }
    token.to_string()
}
