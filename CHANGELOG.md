# Change Log

## 0.8.0
- Added warning for use of unassigned variables.
- Added config option to disable said warning (can be inaccurate when SetScriptVar is used.)
- Added a go to definition provider for local functions.
- Fixed issues with error diagnostics being positioned incorrectly.
- Added several commands to the highlighter that should have been there in the first place.
- Changed commands "DQ" and "LF" to constants in the highlighter.

## 0.7.1
- Nested square / curly brackets should no longer error.
- Flow-control words used in variable names should no longer error.

## 0.7.0
- Diagnostics for unbalanced control flow (e.g. an if without an endif).
- Improved auto indentation/unindentation.
- Corrected spelling of SetUnitSuppressedMovement.

## 0.6.0
- More nuanced diagnostics checker.

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