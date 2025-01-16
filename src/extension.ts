import * as vscode from 'vscode';

import { HoverProvider } from './hover-provider';
import { CompletionItemProvider } from './completion-provider';
import { subscribeDiagnosticChecking } from './diagnostics';
import { ColorProvider } from './color-provider';
import { DefinitionProvider } from './definition-provider';
import { CommandFinder } from './command-finder';

import commands4RPL from './data/4rpl-commands.json';
import specialCommands4RPL from './data/4rpl-special-commands.json';

import commandsIRPL from './data/irpl-commands.json';
import specialCommandsIRPL from './data/irpl-special-commands.json';

export function activate(ctx: vscode.ExtensionContext): void {
    activate4RPL(ctx);
    activateIRPL(ctx);
}

export function deactivate() { }

function activate4RPL(ctx: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration("4rpl");

    const commandFinder = new CommandFinder(commands4RPL, specialCommands4RPL);

    const variableActionRegex = /(?<=^|\s|[\(\[\{])(->|<-|-\?|--|\${1,2})\*?/ig;
    const variableRegex = /(?<=^|\s|[\(\[\{])(?:->|<-|-\?|--|\${1,2})\*?([\w-]+)/ig;
    const functionRegex = /(?<=[:@])\w+/ig;
    const completionItemProvider = new CompletionItemProvider(variableActionRegex, variableRegex, functionRegex, commandFinder);

    ctx.subscriptions.push(
        vscode.languages.registerHoverProvider(         "4rpl", new HoverProvider(commandFinder)),
        vscode.languages.registerCompletionItemProvider("4rpl", completionItemProvider),
        vscode.languages.registerColorProvider(         "4rpl", new ColorProvider()),
        vscode.languages.registerDefinitionProvider(    "4rpl", new DefinitionProvider())
    );

    const readOutputTask = new vscode.Task(
        {type: "4rpl", task: "readGameOutput"},
        vscode.TaskScope.Workspace,
        "CW4 Output",
        "4rpl",
        new vscode.ShellExecution(`Get-Content ${config.get("rplFileName")} -wait`,
            {"cwd": config.get("gameDataFolder")})
    );
    ctx.subscriptions.push(
        vscode.commands.registerCommand("4rpl-lang.read-cw4-output", () => vscode.tasks.executeTask(readOutputTask))
    );

    const diagnostics = vscode.languages.createDiagnosticCollection("diagnostics");
    ctx.subscriptions.push(diagnostics);
    subscribeDiagnosticChecking(ctx, diagnostics, commandFinder, "4rpl");
}

function activateIRPL(ctx: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration("irpl");

    const commandFinder = new CommandFinder(commandsIRPL, specialCommandsIRPL);

    const variableActionRegex = /(?<=^|\s|[\(\[\{])(->|<-|-\?|--|>|<|\${1,2})\*?/ig;
    const variableRegex = /(?<=^|\s|[\(\[\{])(?:->|<-|-\?|--|>|<|\${1,2})\*?([\w-]+)/ig;
    const functionRegex = /(?<=[:@])\w+/ig;
    const completionItemProvider = new CompletionItemProvider(variableActionRegex, variableRegex, functionRegex, commandFinder);

    ctx.subscriptions.push(
        vscode.languages.registerHoverProvider(         "irpl", new HoverProvider(commandFinder)),
        vscode.languages.registerCompletionItemProvider("irpl", completionItemProvider),
        vscode.languages.registerColorProvider(         "irpl", new ColorProvider()),
        vscode.languages.registerDefinitionProvider(    "irpl", new DefinitionProvider())
    );

    const readOutputTask = new vscode.Task(
        {type: "irpl", task: "readGameOutput"},
        vscode.TaskScope.Workspace,
        "IXE Output",
        "irpl",
        new vscode.ShellExecution(`Get-Content ${config.get("rplFileName")} -wait`,
            {"cwd": config.get("gameDataFolder")})
    );
    ctx.subscriptions.push(
        vscode.commands.registerCommand("4rpl-lang.read-ixe-output", () => vscode.tasks.executeTask(readOutputTask))
    );

    const diagnostics = vscode.languages.createDiagnosticCollection("diagnostics");
    ctx.subscriptions.push(diagnostics);
    subscribeDiagnosticChecking(ctx, diagnostics, commandFinder, "irpl");
}
