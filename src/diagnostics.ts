import * as vscode from 'vscode';
import xrpl from "./xrpl.node";

import { CommandFinder } from './command-finder';
import { aliases, classifiers } from "./data/symbols.json";

function refreshDiagnostics(document: vscode.TextDocument, diagnostics: vscode.DiagnosticCollection) {
    if (document.languageId !== "4rpl") return undefined;

    /*
    I'm only calling rust code because I was already working on it separately, and I realised
    I was doing the same thing here. This is a bit of a cobbled together solution and
    balloons the extension's file size so I won't expand this functionality without going
    through a language server.
    */
    const tokens = xrpl.parse(document.getText());
    const errors = xrpl.validate(document.getText());

    const workingDiagnostics: vscode.Diagnostic[] = [];

    for (const error of errors) {
        workingDiagnostics.push( new vscode.Diagnostic(
            new vscode.Range(document.positionAt(error.start), document.positionAt(error.end)),
            error.message,
            vscode.DiagnosticSeverity.Error
        ));
    }

    for (let token of tokens) {
        token = token.replace(/[,\(\)]/ig, "");

        if (token.startsWith('"')) continue;

        let isCommand = true;

        // If token starts with a classifier
        for (const classifier of classifiers) {
            if (token.startsWith(classifier)) {
                isCommand = false;
                break;
            }
        }
        if (!isCommand) continue;

        // If token is an alias
        for (const alias of aliases) {
            if (token == alias) {
                isCommand = false;
                break;
            }
        }
        if (!isCommand) continue;

        // If token is a number
        if (!Number.isNaN(Number(token))) continue;

        // This is probably intended to be a command, so see if it is invalid
        if (CommandFinder.findCommandByName(token) === undefined) {
            const currentWordIndex = document.getText().indexOf(token);
            workingDiagnostics.push(new vscode.Diagnostic(
                new vscode.Range(document.positionAt(currentWordIndex), document.positionAt(currentWordIndex + token.length)),
                `Unrecognised command "${token}".`,
                vscode.DiagnosticSeverity.Error
            ))
        }
    }

    diagnostics.set(document.uri, workingDiagnostics);
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
