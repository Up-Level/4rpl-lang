export type Command = {
    name: string,
    displayName: string,
    usage: string
    description: string,
    url: string,
    kind: string
};

export class CommandFinder {
    public readonly commands: Command[];
    private readonly commandNames: string[];

    constructor(commands: Command[], specialCommands: Command[]) {
        this.commands = commands;
        this.commands.push(...specialCommands);

        this.commandNames = this.commands.map(command => command.displayName);
    }

    public findCommandByName(givenName: String): Command | undefined {
        givenName = givenName.toLowerCase();
        const index = this.commandNames.findIndex(name => name.toLowerCase() == givenName);

        if (index != -1) {
            return this.commands[index];
        }
        return undefined;
    }

    public findPossibleCommandCompletions(toComplete: string) {
        return this.commands.filter(command => command.name.toLowerCase().startsWith(toComplete.toLowerCase()));
    }
}
