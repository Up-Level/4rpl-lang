export type error = {
    message: string,
    start: number,
    end: number
}

export function parse(document: string): string[];
export function validate(document: string): error[];