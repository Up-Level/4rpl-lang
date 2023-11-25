import * as vscode from 'vscode';

import { HoverProvider } from './hover-provider';
import { CompletionItemProvider } from './completion-provider';
import { subscribeDiagnosticChecking } from './diagnostics';

export function activate(ctx: vscode.ExtensionContext): void {
    ctx.subscriptions.push(
        vscode.languages.registerHoverProvider("4rpl", new HoverProvider()));

    ctx.subscriptions.push(
        vscode.languages.registerCompletionItemProvider("4rpl", new CompletionItemProvider()));

    const diagnostics = vscode.languages.createDiagnosticCollection("diagnostics");
    ctx.subscriptions.push(diagnostics);

    subscribeDiagnosticChecking(ctx, diagnostics);
}

export function deactivate() { }
