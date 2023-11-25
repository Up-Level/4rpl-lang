# Change Log

## 0.5.1
- Ignore all commas in the document.

## 0.5.0
- Add a command to read the game's "RPL.txt" output file, and configuration options if this file is not in a standard location.
- Fixed a bug where variables would not autocomplete if written inside brackets.
- Use esbuild to compile the extension.
- Add a colour picker for V4s.
- Ignore commas in diagnostics checking.
- Update command descriptions from wiki.

## 0.4.1
- Recognise "abs" as a valid command.
- Give the name of an unrecognised command in the error.

## 0.4.0
- Add basic diagnostic checking.
- Separate features into different files for readability.

## 0.3.0

- Add hover information for built-in commands from the wiki.
- Add autocomplete for built-in commands, local variables and functions.

## 0.2.0

- Language grammar is now written in YAML and converted to JSON.
- Autoindent upon entering a block.
- Variables will now be recognised when accessing vector values, i.e. `<-var.x`.
- Other miscellaneous fixes.

## 0.1.0

- Initial release