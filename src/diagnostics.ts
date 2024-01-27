import * as vscode from 'vscode';
import xrpl from "./xrpl.node";

import { CommandFinder } from './command-finder';
import { aliases, classifiers } from "./data/symbols.json";
import { Tokeniser } from './tokeniser';

function refreshDiagnostics(document: vscode.TextDocument, diagnostics: vscode.DiagnosticCollection) {
    if (document.languageId !== "4rpl") return undefined;
    
    let unassignedWarning = vscode.workspace.getConfiguration("4rpl").get("unassignedVarWarning");

    /*
    I'm only calling rust code because I was already working on it separately, and I realised
    I was doing the same thing here. This is a bit of a cobbled together solution and
    balloons the extension's file size so I won't expand this functionality without going
    through a language server.
    */
    Tokeniser.update(document.getText());
    const tokens = Tokeniser.tokens;
    const variables = Tokeniser.variables;

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
        //token = token.replace(/[,\(\)]/ig, "");

        if (token.value.startsWith('"')) continue;

        let isCommand = true;

        // If token starts with a classifier
        for (const classifier of classifiers) {
            if (token.value.startsWith(classifier)) {
                if (unassignedWarning) {
                    const variable = token.value.replace(classifier, "").split(".");

                    if (   classifier == "<-"
                        && !variable[0].startsWith("*")
                        && (variable[1] == undefined || variable[1] == "" || !variable[1].match(/[xyzwrgba0123]/))
                        && !variables.includes(variable[0])) {

                        workingDiagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(document.positionAt(token.position), document.positionAt(token.position + token.value.length)),
                            `Use of unassigned variable "${variable[0]}".`,
                            vscode.DiagnosticSeverity.Warning
                        ));
                    }
                }

                isCommand = false;
                break;
            }
        }
        if (!isCommand) continue;

        // If token is an alias
        for (const alias of aliases) {
            if (token.value == alias) {
                isCommand = false;
                break;
            }
        }
        if (!isCommand) continue;

        // If token is a number
        if (!Number.isNaN(Number(token.value))) continue;

        // This is probably intended to be a command, so see if it is invalid
        if (CommandFinder.findCommandByName(token.value) === undefined) {
            workingDiagnostics.push(new vscode.Diagnostic(
                new vscode.Range(document.positionAt(token.position), document.positionAt(token.position + token.value.length)),
                `Unrecognised command "${token.value}".`,
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
        }),
        vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, diagnostics)),
        vscode.workspace.onDidCloseTextDocument(e => diagnostics.delete(e.uri))
    );
}
