import { useContext, useState } from "react";
import { PointVector } from "../triskel/triskel-wasm";
import { Edge } from "../llvmir/cfg";
import { ViewPortContext } from "./context";

export interface EdgeProps {
    waypoints: PointVector;
    edge: Edge;
}
const scaleMap = (x: number) => x * x;

const EdgeView = ({ waypoints, edge }: EdgeProps) => {
    const { scale } = useContext(ViewPortContext);

    const [isHovered, setIsHovered] = useState<boolean>(false);

    let elements = [];
    let start = waypoints.get(0)!;

    let color = "var(--vscode-foreground)";

    if (edge.type === "true") color = "var(--vscode-charts-green)";
    else if (edge.type === "false") color = "var(--vscode-charts-red)";
    if (isHovered) color = "var(--vscode-focusBorder)";

    for (let j = 1; j < waypoints.size(); j++) {
        const end = waypoints.get(j)!;
        elements.push(
            <line
                key={`segment-${j}`}
                x1={start.x * scaleMap(scale)}
                y1={start.y * scaleMap(scale)}
                x2={end.x * scaleMap(scale)}
                y2={end.y * scaleMap(scale)}
                stroke={color}
                strokeWidth="1"
            />
        );
        elements.push(
            <line
                key={`transparent-segment-${j}`}
                x1={start.x * scaleMap(scale)}
                y1={start.y * scaleMap(scale)}
                x2={end.x * scaleMap(scale)}
                y2={end.y * scaleMap(scale)}
                stroke="transparent"
                strokeWidth="20"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            />
        );
        start = end;
    }

    elements.push(
        <polygon
            key="triangle"
            points={`${start.x * scaleMap(scale)},${start.y * scaleMap(scale)} ${(start.x - 5) * scaleMap(scale)},${
                (start.y - 10) * scaleMap(scale)
            } ${(start.x + 5) * scaleMap(scale)},${(start.y - 10) * scaleMap(scale)}`}
            fill={color}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        />
    );

    return <g>{elements}</g>;
};

export default EdgeView;
