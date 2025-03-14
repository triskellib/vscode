import VscodeTextfield from "@vscode-elements/react-elements/dist/components/VscodeTextfield.js";
import VscodeIcon from "@vscode-elements/react-elements/dist/components/VscodeIcon.js";
import VscodeTree from "@vscode-elements/react-elements/dist/components/VscodeTree.js";
import { Function, Module } from "../llvmir/cfg";
import { useContext, useEffect, useState } from "react";
import { SelectedBlockContext, ViewPortContext } from "./context";

export interface FunctionSelectionProps {
    module: Module;
    selectedFunction: Function | undefined;
    setSelectFunction: React.Dispatch<React.SetStateAction<Function | undefined>>;
}

const FunctionSelection = ({ module, selectedFunction, setSelectFunction }: FunctionSelectionProps) => {
    const { selected, setSelected } = useContext(SelectedBlockContext);
    const { setScale } = useContext(ViewPortContext);

    const [search, setSearch] = useState<string>("");

    useEffect(() => {
        const handler = (event: MessageEvent<any>) => {
            const message = event.data; // The JSON data our extension sent
            console.log(message);

            switch (message.command) {
                case "sync": {
                    const function_name = message.function_name;
                    const block_name = message.block_name;

                    if (!selectedFunction || function_name !== selectedFunction.name) {
                        setSelectFunction(module.functions.get(function_name));
                    }

                    setSelected({ name: block_name, shouldFocus: true });

                    break;
                }
            }
        };

        window.addEventListener("message", handler);

        return () => {
            window.removeEventListener("message", handler);
        };
    }, [module, selectedFunction, setSelected, setSelectFunction, setScale]);

    return (
        <div className="flex flex-col overflow-scroll">
            <VscodeTextfield
                placeholder="Search functions"
                className="w-full"
                value={search}
                onInput={(e) => setSearch((e.target as any).value)}
            >
                <VscodeIcon slot="content-before" name="search" title="search" />
            </VscodeTextfield>

            <VscodeTree
                id="function-names"
                indentGuides
                arrows
                data={[...module.functions]
                    .filter(
                        ([k, _]) =>
                            (selectedFunction !== undefined && k === selectedFunction.name) ||
                            k.toLowerCase().indexOf(search.toLowerCase()) != -1
                    )
                    .map(([k, v]) => {
                        if (selectedFunction === undefined || k !== selectedFunction.name)
                            return {
                                label: k,
                                value: `function-${k}`,
                                tooltip: "Function",
                                decorations: [
                                    {
                                        appearance: "counter-badge",
                                        content: `${v.basicBlocks.size}`,
                                    },
                                ],
                                subItems: [
                                    {
                                        label: "",
                                    },
                                ],
                            };

                        return {
                            label: k,
                            tooltip: "Function",
                            value: `function-${k}`,
                            open: true,
                            selected: true,
                            decorations: [
                                {
                                    appearance: "counter-badge",
                                    content: `${v.basicBlocks.size}`,
                                },
                            ],
                            subItems: [...v.basicBlocks]
                                .filter(([k, _]) => k.toLowerCase().indexOf(search.toLowerCase()) != -1)
                                .map(([k, _]) => ({
                                    label: k,
                                    selected: k === selected.name,
                                    tooltip: "Basic Block",
                                    value: `block-${k}`,
                                })),
                        };
                    })}
                onVscTreeSelect={(e) => {
                    console.log(e, e.detail.value, e.detail.label);
                    if (e.detail.value.startsWith("function")) {
                        if (selectedFunction !== undefined && selectedFunction.name === e.detail.label) {
                            setSelectFunction(undefined);
                        } else {
                            setSelectFunction(module.functions.get(e.detail.label));
                        }

                        setSelected({ name: "" });
                    } else if (e.detail.value.startsWith("block")) {
                        if (selected.name === e.detail.label) {
                            setSelected({ name: "" });
                        } else {
                            setSelected({ name: e.detail.label, shouldFocus: true });
                        }
                    }
                }}
            />
        </div>
    );
};

export default FunctionSelection;
