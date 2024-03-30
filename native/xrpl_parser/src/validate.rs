use std::{str::Chars, collections::HashMap/*, time::Instant*/};

static PAIRS: [(&str, &str); 7] = [
    ("if",  "endif"),
    ("once", "endonce"),
    ("do", "loop"),
    ("while", "repeat"),
    ("repeat", "endwhile"),
    ("case", "endcase"),
    ("switch", "endswitch")
];

#[derive(Debug)]
pub struct ValidationError {
    pub message: String,
    pub start: usize,
    pub end: usize
}

pub fn validate(doc_str: &str) -> Vec<ValidationError> {
    //let now = Instant::now();

    let mut document = doc_str.chars();

    let mut errors: Vec<ValidationError> = Vec::new();

    let mut pos = 0;
    let mut root_bracket_pos = 0;
    let mut bracket_nesting = 0;
    let mut last_string_pos;

    let mut was_token;
    let mut current_word = String::new();

    let mut pair_nestings: HashMap<&str, (usize, usize)> = HashMap::new();
    for pair in PAIRS {
        pair_nestings.insert(pair.0, (0, 0));
    }

    while let Some(char) = document.next() {
        was_token = false;
        
        match char {
            char if is_token(char) => {
                current_word.push(char.to_ascii_lowercase());
                was_token = true;
            }
            '"' => {
                last_string_pos = pos;
                if !skip_until('"', &mut document, &mut pos) {
                    errors.push(ValidationError {
                        message: "Unclosed string until end of file".to_owned(), start: last_string_pos, end: pos
                    });
                }
            }
            '#' => {
                skip_until('\n', &mut document, &mut pos);
            }
            '(' => {
                if bracket_nesting == 0 {root_bracket_pos = pos}
                bracket_nesting += 1;
            }
            ')' => {
                if bracket_nesting == 0 {
                    errors.push(ValidationError {
                        message: "Unmatched bracket".to_owned(), start: pos, end: pos
                    });
                }
                else {bracket_nesting -= 1}
            }
            _ => ()
        }

        if !was_token {
            check_pairs(current_word.as_str(), pos, &mut pair_nestings, &mut errors);
            current_word.clear();
        }

        pos += 1;
    }

    check_pairs(current_word.as_str(), pos, &mut pair_nestings, &mut errors);

    if bracket_nesting != 0 {
        errors.push(ValidationError {
            message: "Unmatched bracket".to_owned(), start: root_bracket_pos, end: pos
        });
    }

    for nesting in pair_nestings {
        // Nested tuples :D
        if nesting.1.0 != 0 {
            let mut end_pair = "";
            for pair in PAIRS {
                if pair.0 == nesting.0 {
                    end_pair = pair.1;
                    break;
                }
            }
            errors.push(ValidationError {
                message: format!("\"{}\" does not have a corresponding \"{}\".", nesting.0, end_pair), start: nesting.1.1, end: nesting.1.1 + nesting.0.len()
            });
        }
    }

    /*let elapsed = now.elapsed();
    errors.push(ValidationError {
        message: format!("{:.2?}", elapsed), start: pos, end: pos
    });*/

    errors
}

fn is_token(c: char) -> bool {
    c.is_alphanumeric() || c == '-' || c == '_' || c == ':'
}

fn skip_until(to_find: char, chars: &mut Chars, pos: &mut usize) -> bool {
    *pos += 1;
    loop {
        match chars.next() {
            Some(char) => {
                if char == to_find {
                    return true;
                }
                *pos += 1;
            }
            None => return false
        }
    }
}

fn check_pairs(word: &str, pos: usize, pair_nestings: &mut HashMap<&str, (usize, usize)>, errors: &mut Vec<ValidationError>) {
    /*if !word.is_empty() {
        errors.push(ValidationError {
            message: word.to_owned(), start: pos - word.len(), end: pos
        });
    }*/

    for pair in PAIRS {
        if word == pair.0 {
            let nesting = pair_nestings.get_mut(pair.0).unwrap();
            if nesting.0 == 0 {nesting.1 = pos - word.len()}

            nesting.0 += 1;
        }
        else if word == pair.1 {
            let nesting = pair_nestings.get_mut(pair.0).unwrap();

            if nesting.0 == 0 {
                errors.push(ValidationError {
                    message: format!("\"{}\" does not have a corresponding \"{}\".", pair.1, pair.0), start: pos - word.len(), end: pos
                });
            }

            if nesting.0 > 0 {nesting.0 -= 1}
        }
    }
}
