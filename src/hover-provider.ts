import * as vscode from 'vscode';
import { CommandFinder } from './command-finder';
import { Tokeniser } from './tokeniser';

export class HoverProvider implements vscode.HoverProvider {
    private readonly commandFinder: CommandFinder;
    
    constructor(commandFinder: CommandFinder) {
        this.commandFinder = commandFinder;
    }

    public provideHover(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {

        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range).toLowerCase();

        // Check if this word is a local function
        const localFunction = Tokeniser.functions.find(val => val.value.toLowerCase() === word);

        if (localFunction !== undefined) {
            const hoverText = new vscode.MarkdownString();
            hoverText.supportHtml = true;

            const text = document.getText().substring(localFunction.position);

            // Search for annotations
            const match = text.match(/^[:@]\w+\s+#(.+)(?:\s*\n\s*#([\s\S]+?)\n(?!\s*#.*))?/m);
            if (match !== null) {
                hoverText.appendCodeblock(match[1].trim());
                if (match[2] !== undefined) {
                    const description = match[2].trim()
                        .replace(/(\r\n|\n)/g, "<br>")
                        .replace(/\s*#\s*/g, "");
                    hoverText.appendMarkdown(description);
                }
            }
            else {
                // If no custom annotation then just default to @Func
                hoverText.appendCodeblock("@" + localFunction.value);
            }

            return new vscode.Hover(hoverText);
        }

        // Find the the command corresponding to the hovered word (if it exists).
        const command = this.commandFinder.findCommandByName(word);
        if (command === undefined) return;

        const hoverText = new vscode.MarkdownString();
        hoverText.supportHtml = true;

        hoverText.appendCodeblock(command.usage);
        hoverText.appendMarkdown(command.description);
        hoverText.appendMarkdown(`<a href="${command.url}">Wiki Link</a>`);

        return new vscode.Hover(hoverText);
    }
}
