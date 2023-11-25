import * as vscode from 'vscode';
import { CommandFinder } from './command-finder';

class HoverProvider implements vscode.HoverProvider {
  public provideHover(
    document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {

      const range = document.getWordRangeAtPosition(position);
      const word = document.getText(range).toLowerCase();

      // Find the the command corresponding to the hovered word (if it exists).
      const command = CommandFinder.findCommandByName(word);
      if (command == undefined) return;
      
      const hoverText = new vscode.MarkdownString()
      hoverText.supportHtml = true;

      hoverText.appendCodeblock(command.usage);
      hoverText.appendMarkdown(command.description);
      hoverText.appendMarkdown(`<a href="${command.url}">Wiki Link</a>`);

      return new vscode.Hover(hoverText);
  }
}

class CompletionItemProvider implements vscode.CompletionItemProvider {
  private readonly variableRegex = /(->|<-|-\?|--)(\*?\w*(\.[xyzwrgba0123])?)/ig;
  private readonly functionRegex = /(?<=[:@])\w+/ig;

  private variableCompletion(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] | undefined {
    let completionItems: vscode.CompletionItem[] | undefined = [];

    let range = document.getWordRangeAtPosition(position, this.variableRegex); // Try to find a variable.
    if (range == undefined) return;
    
    const word = document.getText(range).slice(2); // Get variable name, removing the action performed on it (<-, -> etc.).
    const variables = document.getText().matchAll(this.variableRegex); // Get all variables in the document.

    if (variables == null) return;

    for (const variable of variables) {
      const varName = variable[2];
      if (varName == word) continue; // Don't include self

      if (varName.startsWith(word)) {
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
      if (funcStr == word) continue; // Dont include self

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

export function activate(ctx: vscode.ExtensionContext): void {
  ctx.subscriptions.push(
    vscode.languages.registerHoverProvider("4rpl", new HoverProvider()));
  
  ctx.subscriptions.push(
    vscode.languages.registerCompletionItemProvider("4rpl", new CompletionItemProvider(), '\"'));
}

export function deactivate() { }