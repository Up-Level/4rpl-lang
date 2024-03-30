import * as vscode from 'vscode';
import { Tokeniser } from './tokeniser';

export class DefinitionProvider implements vscode.DefinitionProvider {
    private readonly functionRegex = /(?<=@)\w+/ig;
    
    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Location | undefined {
        const range = document.getWordRangeAtPosition(position, this.functionRegex);
        if (range === undefined) return;

        const word = document.getText(range);

        const func = Tokeniser.functions.find(token => token.value.toLowerCase() == word.toLowerCase());
        if (func) {
            return new vscode.Location(document.uri, document.positionAt(func.position));
        }
        return;
    }
}