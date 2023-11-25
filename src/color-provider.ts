import * as vscode from "vscode";

export class ColorProvider implements vscode.DocumentColorProvider {
    // This is horrible. If there's a better way to do this while preserving the numbers as individual captures please tell me
    vectorRegex = /V4\(([0-9.]+),? ([0-9.]+),? ([0-9.]+),? ([0-9.]+)\)|([0-9.]+),? ([0-9.]+),? ([0-9.]+),? ([0-9.]+) V4/gm;

    roundToNearest = (value: number, power: number) => Math.round(value * power) / power;

    public provideDocumentColors(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.ColorInformation[]> {
        let colors: vscode.ColorInformation[] = [];

        const vectorMatches = document.getText().matchAll(this.vectorRegex);

        for (const match of vectorMatches) {
            if (match.index) {
                // Get values of vector from indicies 1-4 or 5-8 depending on whether warp notation was used
                const values = match[1] !== undefined ? match.slice(1, 5) : match.slice(5, 9);
                const valuesNum = values.map(value => Number(value));

                const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));

                colors.push(new vscode.ColorInformation(range, new vscode.Color(valuesNum[0], valuesNum[1], valuesNum[2], valuesNum[3])));
            }

        }
        return colors;
    }

    public provideColorPresentations(color: vscode.Color, context: { readonly document: vscode.TextDocument; readonly range: vscode.Range; }, token: vscode.CancellationToken): vscode.ProviderResult<vscode.ColorPresentation[]> {
        const red = this.roundToNearest(color.red, 1000);
        const green = this.roundToNearest(color.green, 1000);
        const blue = this.roundToNearest(color.blue, 1000);
        const alpha = this.roundToNearest(color.alpha, 1000);

        // If vector is written using warp notation
        if (context.document.getText(context.range).startsWith("V4")) {
            return [new vscode.ColorPresentation(`V4(${red} ${green} ${blue} ${alpha})`)]
        }
        else {
            return [new vscode.ColorPresentation(`${red} ${green} ${blue} ${alpha} V4`)]
        }
    }
}
