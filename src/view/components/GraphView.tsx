import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Function, Edge } from "../llvmir/cfg";
import useWasm from "../hooks/useWasm";
import BasicBlockContainer from "./BasicBlockContainer";
import { BlockLayout, EdgeLayout, Layout } from "./context";
import SplashScreen from "./SplashScreen";
import VscodeProgressRing from "@vscode-elements/react-elements/dist/components/VscodeProgressRing.js";

export interface GraphViewProps {
    fun: Function | undefined;
    setLayout: React.Dispatch<React.SetStateAction<Layout | undefined>>;
}

const dfs = (fun: Function, block_name: string, visited: string[]) => {
    if (visited.indexOf(block_name) != -1) {
        return;
    }
    visited.push(block_name);
    const block = fun.basicBlocks.get(block_name)!;

    block.successors.forEach((child) => {
        dfs(fun, child.to, visited);
    });
};

const GraphView = ({ fun, setLayout }: GraphViewProps) => {
    const [wasm] = useWasm();

    const [laidOut, setLaidOut] = useState<boolean>(false);

    const [visited, setVisited] = useState<string[]>([]);

    const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    useEffect(() => {
        if (fun === undefined) return;

        setLaidOut(false);

        // Identify nodes connected to the root
        let visited: string[] = [];
        dfs(fun, fun.root!, visited);
        setVisited(visited);

        console.log("VISITED", visited);

        itemRefs.current = new Map();
    }, [fun, itemRefs, setVisited, setLaidOut]);

    useEffect(() => {
        if (laidOut || wasm === undefined || fun === undefined) {
            return;
        }

        const layout_graph = async () => {
            console.log("Laying out function");

            const name_map = new Map<string, number>();
            let builder = wasm.make_layout_builder();

            const getSize = (block: string) => {
                const bb = itemRefs.current.get(block)!.getBoundingClientRect()!;

                console.log(block, bb.width, bb.height);
                return bb;
            };

            visited.forEach((block) => {
                const bb = getSize(block);
                const id = builder.make_node(bb.height, bb.width);
                name_map.set(block, id);
            });

            const edges: Map<number, Edge> = new Map();
            visited.forEach((block) =>
                fun.basicBlocks.get(block)!.successors.forEach((edge) => {
                    const id = builder.make_edge(name_map.get(block)!, name_map.get(edge.to)!);
                    edges.set(id, edge);
                })
            );

            let layout = builder.build();

            const blockLayouts = new Map<string, BlockLayout>();
            const edgeLayouts: EdgeLayout[] = [];

            visited.forEach((block) => {
                const id = name_map.get(block);
                const coords = layout.get_coords(id!);
                const size = getSize(block);

                blockLayouts.set(block, {
                    x: coords.x,
                    y: coords.y,
                    width: size.width,
                    height: size.height,
                    block: fun.basicBlocks.get(block)!,
                });
            });

            for (let i = 0; i < layout.edge_count(); i++) {
                edgeLayouts.push({
                    waypoints: layout.get_waypoints(i),
                    edge: edges.get(i)!,
                });
            }

            setLayout({
                blocks: blockLayouts,
                edges: edgeLayouts,
                width: layout.get_width(),
                height: layout.get_height(),
            });
            setLaidOut(true);

            builder.delete();
            layout.delete();
        };

        layout_graph();
    }, [laidOut, visited, wasm, itemRefs, setLaidOut, setLayout]);

    if (laidOut) {
        return null;
    }

    if (fun === undefined) {
        return <SplashScreen />;
    }

    return (
        <div className="w-full h-full flex items-center justify-center">
            <VscodeProgressRing />
            {visited.length > 200 && (
                <p>
                    The function you want to display has {visited.length} nodes
                    <br /> In testing we managed to load functions with less than 1K nodes
                    <br />
                    You might be here a while :)
                </p>
            )}
            <div className="invisible absolute">
                {visited.map((name, idx) => (
                    <div key={idx} ref={(el) => itemRefs.current.set(name, el)}>
                        <BasicBlockContainer
                            block={{ x: 0, y: 0, width: 0, height: 0, block: fun.basicBlocks.get(name)! }}
                            name={name}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GraphView;
