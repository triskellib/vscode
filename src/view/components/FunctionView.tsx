import { useContext, useEffect } from "react";
import { LayoutContext } from "./context";
import TransformContainer from "./TransformContainer";
import BasicBlockContainer from "./BasicBlockContainer";
import EdgeView from "./EdgeView";
import vscode from "../vscode";

const FunctionView = () => {
    const layout = useContext(LayoutContext);

    // Context menu
    useEffect(() => {
        if (layout === undefined) return;

        const handler = (event: MessageEvent<any>) => {
            const message = event.data; // The JSON data our extension sent
            console.log(message);

            switch (message.command) {
                case "basicblock-commands.copy": {
                    const name = message.block;
                    const block = layout.blocks.get(name)!;
                    let text = name + ":\n";

                    block.block.instructions.forEach((instruction) => {
                        text += instruction.content + "\n";
                    });

                    vscode.postMessage({ command: "copy", text });
                    break;
                }

                case "basicblock-commands.goto": {
                    const name = message.block;
                    const block = layout.blocks.get(name)!;
                    const line = block.block.instructions[0].address - 1;

                    vscode.postMessage({ command: "gotoLine", line, moveFocus: true });
                    break;
                }
            }
        };

        window.addEventListener("message", handler);

        return () => {
            window.removeEventListener("message", handler);
        };
    }, [layout]);

    if (layout === undefined) return null;

    return (
        <TransformContainer width={layout.width} height={layout.height}>
            {[...layout.blocks].map(([name, block], idx) => (
                <BasicBlockContainer key={`block-${idx}`} block={block} name={name} />
            ))}
            {layout.edges.map((edge, idx) => (
                <EdgeView key={`edge-${idx}`} waypoints={edge.waypoints} edge={edge.edge} />
            ))}
        </TransformContainer>
    );
};

export default FunctionView;
