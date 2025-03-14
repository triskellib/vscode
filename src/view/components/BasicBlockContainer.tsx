import { useContext, useState } from "react";
import { BasicBlock } from "../llvmir/cfg";
import InstructionContainer from "./InstructionContainer";
import vscode from "../vscode";
import { BlockLayout, SelectedBlockContext, ViewPortContext } from "./context";
import VscodeIcon from "@vscode-elements/react-elements/dist/components/VscodeIcon.js";

export interface BasicBlockContainerProps {
    block: BlockLayout;
    name: string;
}

const scaleMap = (x: number) => x * x;

const BasicBlockContainer = ({ block, name }: BasicBlockContainerProps) => {
    const { selected, setSelected } = useContext(SelectedBlockContext);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const { scale } = useContext(ViewPortContext);

    if (scale < 0.3) {
        return (
            <rect
                x={block.x * scaleMap(scale)}
                y={block.y * scaleMap(scale)}
                width={block.width * scaleMap(scale)}
                height={block.height * scaleMap(scale)}
                fill={selected.name == name ? "var(--vscode-focusBorder)" : "var(--vscode-foreground)"}
            />
        );
    }

    return (
        <g transform={`scale(${scaleMap(scale)})`}>
            <foreignObject x={block.x} y={block.y} width={block.width} height={block.height}>
                <div
                    className="border border-solid py-5 rounded-xs select-none flex flex-col cursor-default"
                    style={{
                        background: "var(--vscode-editor-background)",
                        borderColor: isHovered ? "var(--vscode-focusBorder)" : "var(--vscode-foreground)",
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onFocus={() => setSelected({ name })}
                    onBlur={() => setSelected({ name: "" })}
                >
                    <div className="flex items-center justify-between px-3">
                        <p className="text-lg">label {name}</p>
                        <div className="flex items-center justify-evenly">
                            <VscodeIcon
                                actionIcon
                                name="ellipsis"
                                title="More Actions..."
                                className="ml-2 text-lg"
                                size={18}
                                data-vscode-context={`{"webviewSection": "basicblock-view", "block": "${name}", "preventDefaultContextMenuItems": true }`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.target.dispatchEvent(
                                        new MouseEvent("contextmenu", {
                                            bubbles: true,
                                            clientX: e.clientX,
                                            clientY: e.clientY,
                                        })
                                    );
                                    e.stopPropagation();
                                }}
                            />
                        </div>
                    </div>
                    <hr className="my-2" />

                    {block.block &&
                        block.block.instructions.map((insn, idx) => <InstructionContainer key={idx} insn={insn} />)}
                </div>
            </foreignObject>
        </g>
    );
};

export default BasicBlockContainer;
