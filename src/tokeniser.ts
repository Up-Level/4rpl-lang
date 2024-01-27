import xrpl from "./xrpl.node";

export class Tokeniser {
    private static _tokens: xrpl.token[] = [];
    private static _variables: string[] = ["_DATA"];
    private static _functions: xrpl.token[] = [];

    public static get tokens() {
        return this._tokens;
    }

    public static get variables() {
        return this._variables;
    }

    public static get functions() {
        return this._functions;
    }

    public static update(document: string) {
        this._tokens = xrpl.parse(document);

        for (let token of this._tokens) {
            if (token.value.startsWith("->")) {
                this._variables.push(token.value.replace("->", ""));
            }
            else if (token.value.startsWith("$") || token.value.startsWith("$$")) {
                this._variables.push(token.value.split(":")[0].replace(/\${1,2}/g, ""));
            }
            else if (token.value.startsWith(":")) {
                this._functions.push({
                    value: token.value.substring(1),
                    position: token.position
                });
            }
        }
    }
}