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

    const readOutputTask = new vscode.Task(
        {type: "4rpl", task:"readGameOutput"},
        vscode.TaskScope.Workspace,
        "Game Output",
        "4rpl",
        new vscode.ShellExecution("Get-Content RPL.txt -wait",
            {"cwd": '${userHome}/Documents/my games/creeperworld4'})
    );
    ctx.subscriptions.push(
        vscode.commands.registerCommand("4rpl-lang.read-game-output", () => vscode.tasks.executeTask(readOutputTask))
    )

    subscribeDiagnosticChecking(ctx, diagnostics);
}

export function deactivate() { }
