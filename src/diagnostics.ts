import * as vscode from 'vscode';
import { CommandFinder } from './command-finder';
import {aliases, classifiers} from "./data/symbols.json";

function refreshDiagnostics(document: vscode.TextDocument, diagnostics: vscode.DiagnosticCollection) {
    const workingDiagnostics: vscode.Diagnostic[] = [];

    for (let i = 0; i < document.lineCount; i++) {
        const lineText = document.lineAt(i).text;
        
        const invalidTokens = findInvalidCommands(lineText, i);
        for (const token of invalidTokens) {
            workingDiagnostics.push(new vscode.Diagnostic(
                token, `Unrecognised command "${document.getText(token)}".`, vscode.DiagnosticSeverity.Error
            ));
        }
    }

    diagnostics.set(document.uri, workingDiagnostics);
}

function findInvalidCommands(line: string, lineIndex: number) {
    let invalidCommands = [];

    // https://stackoverflow.com/a/18647776
    const words = line.replace(/[\(\[\{\}\)\] ]/g, " ").replace(",", "").trim().matchAll(/[^\s"]+|"([^"]*)"/gi);

    for (const wordMatch of words) {
        const word = wordMatch[0];

        // If word is part of a comment then skip this line onwards
        if (word.includes("#")) break;
        
        // If word is a string
        if (wordMatch[1]) continue;

        let isCommand = true;

        // If word starts with a classifier
        for (const classifier of classifiers) {
            if (word.startsWith(classifier)) {
                isCommand = false;
                break;
            }
        }
        if (!isCommand) continue;

        // If word is an alias
        for (const alias of aliases) {
            if (word == alias) {
                isCommand = false;
                break;
            }
        }
        if (!isCommand) continue;

        // If word is a number
        if (!Number.isNaN(Number(word))) continue;

        // This is probably a command, so see if it is invalid
        if (CommandFinder.findCommandByName(word) === undefined) {
            const currentWordIndex = line.indexOf(word);
            invalidCommands.push(new vscode.Range(lineIndex, currentWordIndex, lineIndex, currentWordIndex + word.length));
        }
    }

    return invalidCommands;
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

    ctx.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(e => diagnostics.delete(e.uri)));
}
