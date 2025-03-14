import React, { ReactNode, useContext } from "react";
import rules from "../llvmir/highlighting";
import { SelectedBlockContext } from "./context";

export interface SyntaxHighlighterProps {
    children: string;
}

interface Unformatted {
    type: "unformatted";
    value: string;
}

interface Formatted {
    type: "formatted";
    value: ReactNode;
}

const SyntaxHighlighter = ({ children }: SyntaxHighlighterProps) => {
    const { setSelected } = useContext(SelectedBlockContext);

    // Function to apply styles based on regex rules
    const applySyntaxHighlighting = (text: string) => {
        let result: (Unformatted | Formatted)[] = [{ type: "unformatted", value: text }]; // Start with an array that contains the original text

        // Iterate through each rule and apply it to the text
        rules.forEach((rule) => {
            const newResult: (Unformatted | Formatted)[] = [];

            result.forEach((segment) => {
                if (segment.type === "formatted") {
                    newResult.push(segment);
                    return;
                }

                let lastIndex = 0;
                const matches = [...segment.value.matchAll(rule.regex)];

                matches.forEach((match) => {
                    const start = match.index!;
                    const end = start + match[0].length!;

                    if (start > lastIndex) {
                        newResult.push({ type: "unformatted", value: segment.value.slice(lastIndex, start) });
                    }

                    if (rule.name === "label") {
                        newResult.push({
                            type: "formatted",
                            value: (
                                <span
                                    className="cursor-pointer underline"
                                    style={rule.style}
                                    data-token="label"
                                    onClick={() => setSelected({ name: match.groups!["label"]!, shouldFocus: true })}
                                >
                                    {match[0]}
                                </span>
                            ),
                        });
                    } else {
                        newResult.push({
                            type: "formatted",
                            value: (
                                <span style={rule.style} data-token={rule.name}>
                                    {match[0]}
                                </span>
                            ),
                        });
                    }

                    lastIndex = end;
                });

                if (lastIndex < segment.value.length) {
                    newResult.push({ type: "unformatted", value: segment.value.slice(lastIndex) });
                }
            });

            result = newResult;
        });

        return result;
    };

    return <>{applySyntaxHighlighting(children).map((e) => e.value)}</>;
};

export default SyntaxHighlighter;
