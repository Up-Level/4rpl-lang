import * as vscode from 'vscode';
import { CommandFinder } from './command-finder';

export class CompletionItemProvider implements vscode.CompletionItemProvider {
    private readonly variableActionRegex = /(?<=^|\s)(->|<-|-\?|--|\${1,2})\*?/ig;
    private readonly variableRegex = /(?<=^|\s)(?:->|<-|-\?|--|\${1,2})\*?([\w-]+)/ig;
    private readonly functionRegex = /(?<=[:@])\w+/ig;

    private variableCompletion(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] | undefined {
        let completionItems: vscode.CompletionItem[] | undefined = [];

        // Try to find a variable.
        let range = document.getWordRangeAtPosition(position, this.variableRegex);
        if (range == undefined) return;

        // Get variable name, removing the action performed on it (<-, -> etc.).
        const word = document.getText(range).replace(this.variableActionRegex, "");

        // Get all variables in the document.
        let documentNoComments = document.getText().replace(/#.*/g, "");
        const variables = documentNoComments.matchAll(this.variableRegex);
        if (variables == null) return;

        for (const variable of variables) {
            const varName = variable[1];
            if (varName == word) continue; // Don't include self

            if (varName.toLowerCase().startsWith(word.toLowerCase())) {
                if (completionItems.every(item => item.label != varName)) {
                    completionItems.push(new vscode.CompletionItem(varName, vscode.CompletionItemKind.Variable));
                }
            }
        }

        return completionItems;
    }

    private localFunctionCompletion(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] | undefined {
        let completionItems: vscode.CompletionItem[] | undefined = [];

        let range = document.getWordRangeAtPosition(position, this.functionRegex); // Try to find a function.
        if (range == undefined) return;

        const word = document.getText(range).slice(1); // Get function name, removing the @ or :.
        const functions = document.getText().matchAll(this.functionRegex); // Get all variables in the document.

        for (const func of functions) {
            const funcStr = func.toString();
            if (funcStr == word) continue; // Don't include self

            if (funcStr.startsWith(word)) {
                if (completionItems.every(item => item.label != funcStr)) {
                    completionItems.push(new vscode.CompletionItem(funcStr, vscode.CompletionItemKind.Function));
                }
            }
        }

        return completionItems;
    }

    private commandCompletion(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] | undefined {
        let completionItems: vscode.CompletionItem[] | undefined = [];

        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        const possibleCompletions = CommandFinder.findPossibleCommandCompletions(word);
        for (const completion of possibleCompletions) {
            // @ts-ignore
            const kind = vscode.CompletionItemKind[completion.kind];
            completionItems.push(new vscode.CompletionItem(completion.displayName, kind));
        }

        return completionItems;
    }

    public provideCompletionItems(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CompletionItem[] | undefined {
        let completionItems: vscode.CompletionItem[] | undefined = [];

        completionItems = this.variableCompletion(document, position);
        if (completionItems != undefined) return completionItems;

        completionItems = this.localFunctionCompletion(document, position);
        if (completionItems != undefined) return completionItems;

        completionItems = this.commandCompletion(document, position);
        if (completionItems != undefined) return completionItems;
    }
}
