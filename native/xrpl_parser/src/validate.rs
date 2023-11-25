use std::str::Chars;

#[derive(Debug)]
pub struct ValidationError<'a> {
    pub message: &'a str,
    pub start: usize,
    pub end: usize
}

pub fn validate(doc_str: &str) -> Vec<ValidationError> {
    let mut document = doc_str.chars();

    let mut errors: Vec<ValidationError> = Vec::new();

    let mut pos = 0;
    let mut root_bracket_pos = 0;
    let mut bracket_nesting = 0;
    let mut last_string_pos;

    loop {
        match document.next() {
            Some('"') => {
                last_string_pos = pos;
                if !skip_until('"', &mut document, &mut pos) {
                    errors.push(ValidationError {
                        message: "Unclosed string until end of file", start: last_string_pos, end: pos
                    });
                }
            }
            Some('#') => {
                skip_until('\n', &mut document, &mut pos);
            }
            Some('(') => {
                if bracket_nesting == 0 {root_bracket_pos = pos}
                bracket_nesting += 1;
            }
            Some(')') => {
                if bracket_nesting == 0 {
                    errors.push(ValidationError {
                        message: "Unmatched bracket", start: pos, end: pos
                    });
                }
                else {bracket_nesting -= 1}
            }
            Some(_) => (),
            None => {
                pos += 1;

                if bracket_nesting != 0 {
                    errors.push(ValidationError {
                        message: "Unmatched bracket", start: root_bracket_pos, end: pos
                    });
                }

                break;
            }
        }

        pos += 1;
    }

    errors
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
