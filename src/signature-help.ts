import * as vscode from 'vscode';
import { CommandFinder } from './command-finder';

export class SignatureHelpProvider implements vscode.SignatureHelpProvider {
    public provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp> {
        let text = document.getText();

        let pos = document.offsetAt(position);
        let wordFound = false;

        while (pos > 0) {
            pos--;
            let char = text[pos];

            if (char.match(/\w/i)) {
                wordFound = true;
            }
            else if (wordFound) {
                
            }

        }

        let signature = new vscode.SignatureHelp();
        signature.signatures = [new vscode.SignatureInformation(text, command?.usage)];

        return signature;
    }
}
