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
        const funcIndex = Tokeniser.functions.findIndex(val => val.value.toLowerCase() === word);
        
        if (funcIndex !== -1) {
            const localFunction = Tokeniser.functions[funcIndex];

            const hoverText = new vscode.MarkdownString();
            hoverText.supportHtml = true;

            const text = document.getText();
            // The end of this function is either the end of the document or the beginning of the next function
            const endIndex = Tokeniser.functions.length === funcIndex + 1 ? text.length : Tokeniser.functions[funcIndex + 1].position;
            const functionContent = text.substring(localFunction.position, endIndex);

            // Search for annotations
            const match = functionContent.match(/^[:@]\w+\s+#(.+)(?:\s*\n\s*#([\s\S]+?)\n(?!\s*#.*))?/m);
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
