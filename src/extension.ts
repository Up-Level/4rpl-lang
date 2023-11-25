import * as vscode from 'vscode';
import commands from './data/commands.json';

class HoverProvider implements vscode.HoverProvider {
  private commandNames = commands.map(command => {
    return command.name;
  });
 
  public provideHover(
    document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {

      const range = document.getWordRangeAtPosition(position);
      const word = document.getText(range).toLowerCase();

      // Find the index of the command of the hovered word (if it exists).
      const index = this.commandNames.findIndex(name => {
        return name == word;
      });

      if (index != -1) {
        // Get command object from index
        const command = commands[index];
        const hoverText = new vscode.MarkdownString()
        hoverText.supportHtml = true;

        hoverText.appendCodeblock(command.usage);
        hoverText.appendMarkdown(command.description);
        hoverText.appendMarkdown(`<a href="${command.url}">Wiki Link</a>`);
        console.log(hoverText.value);

        return new vscode.Hover(hoverText);
      }

      return;
  }
}

export function activate(ctx: vscode.ExtensionContext): void {
  ctx.subscriptions.push(
    vscode.languages.registerHoverProvider("4rpl", new HoverProvider()));
}

export function deactivate() { }