export type token = {
    value: string,
    position: number
}

export type error = {
    message: string,
    start: number,
    end: number
}

export function parse(document: string): token[];
export function validate(document: string): error[];