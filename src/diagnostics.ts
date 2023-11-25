import * as vscode from 'vscode';
import { CommandFinder } from './command-finder';

const nonCommandIndicators = ["->","<-","-?","--","$","@",":", "\""];
const exceptions = ["+", "&&", "/", "==", ">", ">=", "<", "<=", "%", "*", "!=", "!", "||", "^", "-"];

function refreshDiagnostics(document: vscode.TextDocument, diagnostics: vscode.DiagnosticCollection) {
    const workingDiagnostics: vscode.Diagnostic[] = [];

    for (let i = 0; i < document.lineCount; i++) {
        const lineText = document.lineAt(i).text;
        
        const invalidTokens = findInvalidTokens(lineText, i);
        for (const token of invalidTokens) {
            workingDiagnostics.push(new vscode.Diagnostic(
                token, "Unrecognised command.", vscode.DiagnosticSeverity.Error
            ));
        }
    }

    diagnostics.set(document.uri, workingDiagnostics);

}

function findInvalidTokens(line: string, lineIndex: number) {
    let invalidTokens = [];

    // https://stackoverflow.com/a/18647776
    const words = line.trim().replace(/[\(\[\{\}\)\] ]/g, " ").matchAll(/[^\s"]+|"([^"]*)"/gi);

    for (const wordMatch of words) {
        // If word is a string
        if (wordMatch[1]) continue;

        const word = wordMatch[0];

        // If word is part of a comment
        if (word.includes("#")) break;

        let isCommand = true;

        // If word starts with a non-command indicator
        for (const indicator of nonCommandIndicators) {
            if (word.startsWith(indicator)) {
                isCommand = false;
                break;
            }
        }

        // If word is an exception
        for (const exception of exceptions) {
            if (word == exception) {
                isCommand = false;
                break;
            }
        }

        // If word is a number
        if (!Number.isNaN(Number(word))) isCommand = false;

        // This is probably a command, so see if it is valid
        if (isCommand && CommandFinder.findCommandByName(word) === undefined) {
            const currentWordIndex = line.indexOf(word);
            invalidTokens.push(new vscode.Range(lineIndex, currentWordIndex, lineIndex, currentWordIndex + word.length));
        }
    }

    return invalidTokens;
}

// https://github.com/microsoft/vscode-extension-samples/blob/main/code-actions-sample/src/diagnostics.ts
export function subscribeDiagnosticChecking(ctx: vscode.ExtensionContext, diagnostics: vscode.DiagnosticCollection) {
    if (vscode.window.activeTextEditor) {
        refreshDiagnostics(vscode.window.activeTextEditor.document, diagnostics);
    }

    ctx.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(e => {
            if (e) refreshDiagnostics(e.document, diagnostics);
        })
    );

    ctx.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, diagnostics)));
}
