import { useCallback } from "react";
import { Instruction } from "../llvmir/cfg";
import vscode from "../vscode";
import "../styles.css";
import SyntaxHighlighter from "./SyntaxHighlighter";

export interface InstructionContainerProps {
    insn: Instruction;
}

const InstructionContainer = ({ insn }: InstructionContainerProps) => {
    const gotoLine = useCallback(
        (i: number) => {
            vscode.postMessage({ command: "gotoLine", line: insn.address + i });
        },
        [insn.address]
    );

    return (
        <>
            {insn.content.split("\n").map((line, i) => (
                <p
                    tabIndex={0}
                    className="insn relative text-nowrap editor-text select-text w-full px-3"
                    onClick={() => gotoLine(i)}
                >
                    <span
                        className="select-none inline-block"
                        style={{ color: "var(--vscode-editorLineNumber-foreground)", width: "6ch", textAlign: "right" }}
                    >
                        {insn.address + i}
                    </span>
                    <span className="pl-3 cursor-text">
                        <SyntaxHighlighter>{line}</SyntaxHighlighter>
                    </span>
                </p>
            ))}
        </>
    );
};

export default InstructionContainer;
