import commands from './data/commands.json'
import { CompletionItemKind } from 'vscode';

export type Command = {
    name: string,
    displayName: string,
    usage: string
    description: string,
    url: string,
    kind: string
};

export class CommandFinder {
    public static readonly commands = commands;
    private static readonly commandNames = commands.map(command => command.displayName);

    public static findCommandByName(givenName: String): Command | undefined {
        givenName = givenName.toLowerCase();
        const index = this.commandNames.findIndex(name => name.toLowerCase() == givenName);

        if (index != -1) {
            return commands[index];
        }
        return undefined;
    }

    public static findPossibleCommandCompletions(toComplete: string) {
        return this.commands.filter(command => command.name.toLowerCase().startsWith(toComplete.toLowerCase()));
    }
}
