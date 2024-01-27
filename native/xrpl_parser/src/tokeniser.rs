//use std::collections::HashMap;

use regex::{Captures, Regex};
use once_cell::sync::Lazy;

#[derive(Debug)]
pub struct Token {
    pub value: String,
    pub position: usize
}

/*static ALIASES: Lazy<HashMap<&str, &str>> = Lazy::new(|| HashMap::from([
    ("+",  "add"),
    ("&&", "and"),
    ("/",  "div"),
    ("==", "eq"),
    (">",  "gt"),
    (">=", "gte"),
    ("<",  "lt"),
    ("<=", "lte"),
    ("%",  "mod"),
    ("*",  "mul"),
    ("!=", "neq"),
    ("!",  "not"),
    ("||", "or"),
    ("^",  "pow"),
    ("-",  "sub")
]));*/

static REPLACE_REGEXES: Lazy<Vec<(Regex, &str)>> = Lazy::new(|| vec![
    (Regex::new(r"#.+").unwrap(),                          ""),
    (Regex::new(r",").unwrap(),                            ""),
    (Regex::new(r"->(\*?[\w-]+)[ \n]*\[(.*?)\]").unwrap(), " <-$1 $2 SetListElementRPN"),
    (Regex::new(r"->(\*?[\w-]+)[ \n]*\{(.*?)\}").unwrap(), " <-$1 $2 SetTableElementRPN")
]);

static PRESERVE_IN_STRING: [char; 4] = ['(',')','#',','];
static PRESERVE_REG: Lazy<Regex> = Lazy::new(|| Regex::new(r"[\(\)#,]").unwrap());

static STRING_REG: Lazy<Regex> = Lazy::new(|| Regex::new("\".*?\"").unwrap());
static TOKEN_REG:  Lazy<Regex> = Lazy::new(|| Regex::new("\"[^\"]*\"|[^\\s\"\\[\\](){}]+").unwrap());

static TOKEN_SEPARATORS: [char; 8] = [
    ':', '(', ')', '[', ']', '{', '}', '"'
];

/// Tokenise the given input.
pub fn parse(inp_doc: &str) -> Vec<Token> {
    let mut document = inp_doc.to_owned();

    /*document = document.split('"').enumerate().map(|(i, item)| {
        if i % 2 == 0 {
            let mut new_item = item.to_string();
            for regex in REPLACE_REGEXES.iter() {
                new_item = regex.0.replace_all(&new_item, regex.1).to_string();
            }
            return new_item;
        }
        
        return "\"".to_string() + item + "\"";
    }).collect::<Vec<_>>().join("");*/

    let pres_required;
    (document, pres_required) = preserve_string(&document);

    for regex in REPLACE_REGEXES.iter() {
        document = regex.0.replace_all(&document, regex.1).to_string();
    }

    document = unwarp(&document, '(', ')', &bracket_unwarper);
    document = unwarp(&document, '[', ']', &sqr_bracket_unwarper);
    document = unwarp(&document, '{', '}', &curly_bracket_unwarper);

    if pres_required {
        document = unpreserve_string(&document);
    }

    let token_strings = tokenise(&document);

    let uncommented = REPLACE_REGEXES[0].0.replace_all(&inp_doc, |caps: &Captures| {
        " ".repeat(caps[0].len())
    }).to_string();

    recover_positions(&uncommented, token_strings)
}

fn preserve_string(document: &str) -> (String, bool) {
    let mut doc_clone: String = document.to_owned();
    let mut required = false;

    for str_match in STRING_REG.find_iter(document) {
        if !PRESERVE_REG.is_match(str_match.into()) { continue; }
        required = true;

        let mut replaced_by: String = str_match.as_str().to_string();

        for (i, preserve) in PRESERVE_IN_STRING.iter().enumerate() {
            replaced_by = replaced_by.replace(*preserve, &format!("__{i}__"));
        }

        doc_clone = doc_clone.replace(str_match.as_str(), &replaced_by);
    }

    (doc_clone, required)
}

fn unpreserve_string(document: &str) -> String{
    let mut doc_clone: String = document.to_owned();

    for str_match in STRING_REG.find_iter(document) {
        let mut replaced_by = str_match.as_str().to_string();
        
        for (i, preserve) in PRESERVE_IN_STRING.iter().enumerate() {
            replaced_by = replaced_by.replace(&format!("__{i}__"), preserve.to_string().as_str());
        }

        doc_clone = doc_clone.replace(str_match.as_str(), &replaced_by);
    }

    doc_clone
}

fn unwarp(document: &str, start_delim: char, end_delim: char, unwarper: &dyn Fn(Vec<char>, Vec<char>) -> Vec<char>) -> String {
    let mut current_index = 0;
    let mut current_look_behind;
    let mut current_look_ahead;
    let mut word_index = 0;
    let mut end_warp_index;
    let mut word_found = false;
    let mut nesting = 1;

    let mut chars: Vec<char> = document.chars().collect();

    while current_index < chars.len() {
        if chars[current_index] == start_delim {
            if current_index != 0 {
                current_look_behind = current_index - 1;
                while current_look_behind > 0 {
                    let char = chars[current_look_behind];

                    if char.is_alphanumeric() {
                        word_found = true;
                    }
                    else if word_found && char.is_whitespace() {
                        word_index = current_look_behind + 1;
                        word_found = false;
                        break;
                    }

                    current_look_behind -= 1;
                }
            }

            current_look_ahead = current_index + 1;
            loop {
                let char = chars[current_look_ahead];

                if      char == start_delim { nesting += 1; }
                else if char == end_delim {
                    nesting -= 1;
                    if nesting == 0 {
                        end_warp_index = current_look_ahead;
                        nesting = 1;
                        break;
                    }
                }

                current_look_ahead += 1;

                if current_look_ahead >= chars.len() {
                    end_warp_index = current_index + 1;
                    break;
                }
            }
            
            let unwarped = unwarper(
                Vec::from(&chars[word_index..current_index]),
                Vec::from(&chars[(current_index + 1)..end_warp_index])
            );

            chars.splice(word_index..(end_warp_index + 1), unwarped);

            current_index = word_index - 1;
        }

        current_index += 1;
    }

    chars.iter().collect()
}

fn tokenise(document: &str) -> Vec<String> {
    TOKEN_REG.find_iter(document)
        .map(|t| {
            t.as_str().trim().replace('\t', "")
        })
        .filter(|t| !t.is_empty())
        .collect()
}

fn recover_positions(document: &str, token_strings: Vec<String>) -> Vec<Token> {
    let mut unique_token_strings: Vec<String> = Vec::new();
    for token in token_strings {
        if !unique_token_strings.contains(&token) {
            unique_token_strings.push(token);
        }
    }

    let mut tokens: Vec<Token> = Vec::new();
    for token_string in unique_token_strings.iter() {
        document.match_indices(token_string).for_each(|(i, _)| {
            match document.get(i - 1 .. i + token_string.len() + 1) {
                Some(boundaries) => {
                    if is_token_separator( boundaries.chars().next() ) &&
                       is_token_separator( boundaries.chars().last() ) {
                        tokens.push(Token {
                            value: token_string.to_string(),
                            position: i
                        })
                    }
                },
                None => ()
            };
        });
    }

    tokens.sort_unstable_by_key(|t| t.position);

    tokens
}

fn is_token_separator(character: Option<char>) -> bool {
    match character {
        Some(c) => return c.is_whitespace() || TOKEN_SEPARATORS.contains(&c),
        None    => return true
    }
}

fn bracket_unwarper(word: Vec<char>, enclosed: Vec<char>) -> Vec<char> {
    let mut unwarped = 
    Vec::from(enclosed);
    unwarped.push(' ');
    unwarped.extend(word);

    unwarped
}

fn sqr_bracket_unwarper(word: Vec<char>, enclosed: Vec<char>) -> Vec<char> {
    let mut unwarped =
    Vec::from(word);
    unwarped.push(' ');
    unwarped.extend(enclosed);
    unwarped.extend(" GetListElement".chars().collect::<Vec<char>>());

    unwarped
}

fn curly_bracket_unwarper(word: Vec<char>, enclosed: Vec<char>) -> Vec<char> {
    let mut unwarped =
    Vec::from(word);
    unwarped.push(' ');
    unwarped.extend(enclosed);
    unwarped.extend(" GetTableElement".chars().collect::<Vec<char>>());

    unwarped
}
