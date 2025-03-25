# Change Log

## 1.1.0
- Added functionality for hover information to be defined for local functions. The syntax for this is as follows:
    ```
    :Function
        # @FunctionParameters(<-param1 <-param2)
        # This is a description for the function.
        # It can be multi-line. It also supports **markdown** (except headings).
    ```

## 1.0.4
- Added new commands from documentation.
- Automated reading the command index (4rpl-command-reader).

## 1.0.3
- Added new commands from documentation.
- Added ref read/write/exists/delete functions.
- Fixed bug where commas were being interpreted as "" instead of " ".
- Fixed bug where multi-line strings were not tokenised correctly.
- Fixed bug causing refread/write to be interpreted as a variable named !.
- Fixed bug causing i j k variables to not be considered variables if at the start of a new line.

## 1.0.2
- Added new commands from documentation.
- Fixed bug that caused tab groups to be interpreted as command usage (4rpl-command-reader).

## 1.0.1
- Added new commands from documentation.
- Fixed bug that caused `>` and `<` to be read as variables with no name.

## 1.0.0
- Full IRPL support. Some commands do not have hover information as their wiki pages do not exist yet.
- Refactoring of code to support multiple languages.

## 0.9.0
- Added syntax highlighting for IRPL. More features will be added once documentation is released and the wiki more complete.

## 0.8.5
- Added new commands from version 2.5.1.
- Made E a constant rather than a function.
- Streamlined build process.

## 0.8.4
- Refactor of tokeniser to hopefully stop weird errors.

## 0.8.3
- Fixed bug that treated a # in a string as a comment.
- Fixed bug that broke the tokeniser when a token was at the beginning or end of a file.

## 0.8.2
- Fixed bug that caused _DATA to not be recognised as a variable.

## 0.8.1
- Added new commands that weren't included previously.
- Fixed bug that caused errors for invalid commands inside strings/comments.
- Made variables, flow control and functions case-insensitive.
- Fixed refread and refwrite not being recognised as commands.
- Fixed tokenised values not being reset every time they get updated.
- Removed string escaping (4rpl doesn't have this).
- Fixed highlighting of keywords in certain situations.

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