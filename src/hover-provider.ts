import * as vscode from 'vscode';
import { CommandFinder } from './command-finder';

export class HoverProvider implements vscode.HoverProvider {
    public provideHover(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {

        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range).toLowerCase();

        // Find the the command corresponding to the hovered word (if it exists).
        const command = CommandFinder.findCommandByName(word);
        if (command == undefined) return;

        const hoverText = new vscode.MarkdownString();
        hoverText.supportHtml = true;

        hoverText.appendCodeblock(command.usage);
        hoverText.appendMarkdown(command.description);
        hoverText.appendMarkdown(`<a href="${command.url}">Wiki Link</a>`);

        return new vscode.Hover(hoverText);
    }
}
