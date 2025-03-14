// Inspired by https://github.com/colejcummins/llvm-syntax-highlighting/

import { CSSProperties, ReactNode } from "react";

export interface HighlightStyle {
    regex: RegExp;
    style: CSSProperties;
    name: string;
    callback?: (match: string) => ReactNode;
}

namespace RegexPatterns {
    // A modified \b
    const b = "(\\b(?<![-!#.%@$_]))";

    const identifier = "([-a-zA-Z$._][-a-zA-Z$._0-9]*)";

    export const mnemonic = new RegExp(
        `${b}(add|alloca|and|ashr|atomicrmw|attributes|bitcast|br|call|cmpxchg|declare|exact|extractelement|extractvalue|fadd|fcmp|fdiv|fence|fmul|fpext|fptosi|fptoui|fptrunc|frem|fsub|getelementptr|global|icmp|indirectbr|insertelement|insertvalue|inttoptr|invoke|landingpad|load|lshr|mul|one|or|ord|ptrtoint|resume|ret|sdiv|select|sext|shl|shufflevector|sitofp|srem|store|sub|switch|target|trunc|type|udiv|uitofp|unreachable|unwind|urem|va_arg|xor|zext)\\b`,
        "g"
    );

    export const local = new RegExp(`%\\b(${identifier}|\\d+)\\b`, "g");
    export const label = new RegExp(`\\blabel\\s+(?<label>%(${identifier}|\\d+))\\b`, "g");
    export const global = new RegExp(`@\\b${identifier}\\b`, "g");

    export const attribute = new RegExp(`[#!]\\b[-a-zA-Z$._0-9]+\\b`, "g");

    export const constant = new RegExp(`${b}(true|false|null|none)\\b`, "g");
    export const int = new RegExp(`${b}\\d+\\b`, "g");
    export const float = new RegExp(`${b}\\d+\\.\\d+\\b`, "g");
    export const hex = new RegExp(`${b}0(x|X)[0-9a-fA-F]+\\b`, "g");

    export const string = new RegExp(`".+?"(?<!(\\\\"))`, "g");

    export const comment = new RegExp(`;.*$`, "g");

    export const primitives = new RegExp(
        `${b}(i\\d+|ptr|void|half|bfloat|float|double|fp128|x86_fp80|ppc_fp128)\\b`,
        "g"
    );
    export const vector = new RegExp(`(<.+?>+)`, "g");
    export const array = new RegExp(`(\\[d+s+xs+.+?\\]+)`, "g");
}

const rules: HighlightStyle[] = [
    {
        name: "comment",
        regex: RegexPatterns.comment,
        style: { color: "var(--vscode-symbolIcon-commentForeground)" },
    },
    {
        name: "string",
        regex: RegexPatterns.string,
        style: { color: "var(--vscode-symbolIcon-stringForeground)" },
    },
    {
        name: "label",
        regex: RegexPatterns.label,
        style: { color: "var(--vscode-symbolIcon-textForeground)" },
    },
    {
        name: "local",
        regex: RegexPatterns.local,
        style: { color: "var(--vscode-symbolIcon-textForeground)" },
    },
    {
        name: "global",
        regex: RegexPatterns.global,
        style: { color: "var(--vscode-symbolIcon-textForeground)" },
    },
    {
        name: "attribute",
        regex: RegexPatterns.attribute,
        style: { color: "var(--vscode-symbolIcon-colorForeground)" },
    },
    {
        name: "constant",
        regex: RegexPatterns.constant,
        style: { color: "var(--vscode-symbolIcon-numberForeground)" },
    },
    {
        name: "float",
        regex: RegexPatterns.float,
        style: { color: "var(--vscode-symbolIcon-numberForeground)" },
    },
    {
        name: "int",
        regex: RegexPatterns.int,
        style: { color: "var(--vscode-symbolIcon-numberForeground)" },
    },
    {
        name: "hex",
        regex: RegexPatterns.hex,
        style: { color: "var(--vscode-symbolIcon-numberForeground)" },
    },
    {
        name: "mnemonic",
        regex: RegexPatterns.mnemonic,
        style: { color: "var(--vscode-symbolIcon-keywordForeground)" },
    },
    {
        name: "primitive",
        regex: RegexPatterns.primitives,
        style: { color: "var(--vscode-symbolIcon-structForeground)" },
    },
    {
        name: "vector",
        regex: RegexPatterns.vector,
        style: { color: "var(--vscode-symbolIcon-structForeground)" },
    },
    {
        name: "array",
        regex: RegexPatterns.array,
        style: { color: "var(--vscode-symbolIcon-structForeground)" },
    },
];

export default rules;
