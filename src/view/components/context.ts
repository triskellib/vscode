import { createContext } from "react";
import { Point, PointVector } from "../triskel/triskel-wasm";
import { BasicBlock, Edge } from "../llvmir/cfg";

export interface ViewPort {
    scale: number;
    setScale: React.Dispatch<React.SetStateAction<number>>;
    pan: Point;
    setPan: React.Dispatch<React.SetStateAction<Point>>;
    size: Point;
    setSize: React.Dispatch<React.SetStateAction<Point>>;
}

export const ViewPortContext = createContext<ViewPort>({
    scale: 0,
    pan: { x: 0, y: 0 },
    size: { x: 0, y: 0 },
    setScale: () => {},
    setSize: () => {},
    setPan: () => {},
});

export interface BlockLayout {
    x: number;
    y: number;
    width: number;
    height: number;

    block: BasicBlock;
}

export interface EdgeLayout {
    waypoints: PointVector;
    edge: Edge;
}

export interface Layout {
    blocks: Map<string, BlockLayout>;
    edges: EdgeLayout[];
    width: number;
    height: number;
}

export const LayoutContext = createContext<Layout | undefined>(undefined);

export interface BlockSelection {
    name: string;
    shouldFocus?: boolean;
}

export interface SelectedBlock {
    selected: BlockSelection;
    setSelected: React.Dispatch<React.SetStateAction<BlockSelection>>;
}
export const SelectedBlockContext = createContext<SelectedBlock>({
    selected: { name: "" },
    setSelected: () => {},
});
