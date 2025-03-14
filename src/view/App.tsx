import React, { useEffect, useState } from "react";
import "./styles.css";

import useFileContents from "./hooks/useFileContents";
import { Function, Module } from "./llvmir/cfg";
import { parse } from "./llvmir/parser";
import GraphView from "./components/GraphView";
import { BlockSelection, Layout, LayoutContext, SelectedBlockContext, ViewPortContext } from "./components/context";
import FunctionView from "./components/FunctionView";
import { Point } from "./triskel/triskel-wasm";
import Minimap from "./components/Minimap";
import VscodeProgressRing from "@vscode-elements/react-elements/dist/components/VscodeProgressRing.js";
import VscodeSplitLayout from "@vscode-elements/react-elements/dist/components/VscodeSplitLayout.js";
import VscodeCollapsible from "@vscode-elements/react-elements/dist/components/VscodeCollapsible.js";
import FunctionSelection from "./components/FunctionSelection";

const App = () => {
    const document = useFileContents();
    const [module, setModule] = useState<Module | undefined>(undefined);
    const [selectedFunction, setSelectFunction] = useState<Function | undefined>(undefined);
    const [layout, setLayout] = useState<Layout | undefined>(undefined);
    const [selected, setSelected] = useState<BlockSelection>({ name: "" });

    const [scale, setScale] = useState<number>(1);
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    const [size, setSize] = useState<Point>({ x: 0, y: 0 });

    useEffect(() => {
        if (document === undefined) {
            return;
        }
        setModule(parse(document));
    }, [document, setModule]);

    if (module === undefined) {
        return (
            <div className="flex w-full h-screen justify-center items-center">
                <VscodeProgressRing />
            </div>
        );
    }

    return (
        <div className="flex w-full h-screen">
            <LayoutContext.Provider value={layout}>
                <ViewPortContext.Provider value={{ scale, setScale, pan, setPan, size, setSize }}>
                    <SelectedBlockContext.Provider value={{ selected, setSelected }}>
                        <VscodeSplitLayout initialHandlePosition="300px">
                            <div slot="start">
                                <div className="p-3 flex h-full w-full flex-col">
                                    <FunctionSelection
                                        module={module}
                                        selectedFunction={selectedFunction}
                                        setSelectFunction={setSelectFunction}
                                    />

                                    <div className="grow-1" />

                                    <VscodeCollapsible title="Graph overview" className="shrink-0 w-full" open>
                                        <Minimap />
                                    </VscodeCollapsible>
                                </div>
                            </div>

                            <div slot="end">
                                <GraphView fun={selectedFunction} setLayout={setLayout} />
                                <FunctionView />
                            </div>
                        </VscodeSplitLayout>
                    </SelectedBlockContext.Provider>
                </ViewPortContext.Provider>
            </LayoutContext.Provider>
        </div>
    );
};

export default App;
