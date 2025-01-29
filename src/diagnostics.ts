import * as vscode from 'vscode';
import xrpl from "./xrpl.node";

import { CommandFinder } from './command-finder';
import { Tokeniser } from './tokeniser';

import symbols4RPL from "./data/4rpl-symbols.json";
import symbolsIRPL from "./data/irpl-symbols.json";

function refreshDiagnostics(document: vscode.TextDocument, diagnostics: vscode.DiagnosticCollection, commandFinder: CommandFinder, language: "4rpl" | "irpl") {
    if (document.languageId !== language) return undefined;

    let aliases, classifiers;
    if (language === "4rpl") {
        aliases = symbols4RPL.aliases;
        classifiers = symbols4RPL.classifiers;
    }
    else {
        aliases = symbolsIRPL.aliases;
        classifiers = symbolsIRPL.classifiers;
    }
    
    let unassignedWarning = vscode.workspace.getConfiguration(language).get("unassignedVarWarning");

    /*
    I'm only using rust code because I was already working on it separately, and I realised
    I was doing the same thing here. This is a bit of a cobbled together solution and
    balloons the extension's file size so I won't expand this functionality without going
    through a language server.
    */
    
    Tokeniser.update(document.getText());
    const tokens = Tokeniser.tokens;
    const variables = Tokeniser.variables;
    const lowerCaseVariables = variables.map(v => v.toLowerCase());

    const errors = xrpl.validate(document.getText());

    const workingDiagnostics: vscode.Diagnostic[] = [];

    for (const error of errors) {
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(document.positionAt(error.start), document.positionAt(error.end)),
            error.message,
            vscode.DiagnosticSeverity.Error
        );
        diagnostic.source = "xrpl-lang";

        workingDiagnostics.push(diagnostic);
    }

    for (let token of tokens) {
        //token = token.replace(/[,\(\)]/ig, "");

        if (token.value.startsWith('"')) continue;

        let isCommand = true;

        // If token starts with a classifier
        for (const classifier of classifiers) {
            if (token.value.startsWith(classifier) && token.value !== classifier) {
                // Unassigned var check
                if (unassignedWarning) {
                    // Edge case nightmare

                    const variable = token.value.replace(classifier, "").split(".");
                    if (variable[0] === "!" || variable[0] === "-!") continue;

                    if (   (classifier == "<-" || classifier == "<") // Works the same for both 4RPL and IRPL, good enough
                        && !variable[0].startsWith("*") // Not a global variable
                        //&& (variable[1] === undefined || variable[1] === "" || !variable[1].match(/[xyzwrgba0123]/))
                        && !lowerCaseVariables.includes(variable[0].toLowerCase())) { // Variable not known

                        const diagnostic = new vscode.Diagnostic(
                            new vscode.Range(document.positionAt(token.position), document.positionAt(token.position + token.value.length)),
                            `Use of unassigned variable "${variable[0]}".\nThis warning can be disabled in the extension config by unchecking "${language}.unassignedVarWarning".`,
                            vscode.DiagnosticSeverity.Warning
                        )
                        diagnostic.source = "xrpl-lang"

                        workingDiagnostics.push(diagnostic);
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
        if (commandFinder.findCommandByName(token.value) === undefined) {
            workingDiagnostics.push(new vscode.Diagnostic(
                new vscode.Range(document.positionAt(token.position), document.positionAt(token.position + token.value.length)),
                `Unrecognised command "${token.value}".`,
                vscode.DiagnosticSeverity.Error
            ));
        }
    }

    diagnostics.set(document.uri, workingDiagnostics);
}

// https://github.com/microsoft/vscode-extension-samples/blob/main/code-actions-sample/src/diagnostics.ts
export function subscribeDiagnosticChecking(ctx: vscode.ExtensionContext, diagnostics: vscode.DiagnosticCollection, commandFinder: CommandFinder, language: "4rpl" | "irpl") {
    if (vscode.window.activeTextEditor) {
        refreshDiagnostics(vscode.window.activeTextEditor.document, diagnostics, commandFinder, language);
    }
    
    ctx.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(e => {
            if (e) refreshDiagnostics(e.document, diagnostics, commandFinder, language);
        }),
        vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, diagnostics, commandFinder, language)),
        vscode.workspace.onDidCloseTextDocument(e => diagnostics.delete(e.uri))
    );
}
