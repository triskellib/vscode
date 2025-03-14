import React, { useState, useRef, ReactNode, useCallback, useEffect, useContext } from "react";
import { LayoutContext, SelectedBlockContext, ViewPortContext } from "./context";
import { Point } from "../triskel/triskel-wasm";

const PADDING = 200;

const Minimap = () => {
    const layout = useContext(LayoutContext);
    const viewport = useContext(ViewPortContext);
    const { selected } = useContext(SelectedBlockContext);

    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement | null>(null);

    const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });

    const scaleMap = useCallback((x: number) => x * x, []);

    // Centers the graph
    const center = useCallback(() => {
        if (!containerRef.current || layout === undefined) return;

        const paddedWidth = layout.width + 2 * PADDING;
        const paddedHeight = layout.height + 2 * PADDING;

        const rect = containerRef.current.getBoundingClientRect();
        const newScale = Math.min(rect.width / paddedWidth, rect.height / paddedHeight);
        setScale(Math.sqrt(newScale));

        let x = 0;
        if (paddedWidth < rect.width / newScale) {
            x = (paddedWidth - rect.width / newScale) / 2;
        }

        let y = 0;
        if (paddedHeight < rect.height / newScale) {
            y = (paddedHeight - rect.height / newScale) / 2;
        }

        x = (x - PADDING) * newScale;
        y = (y - PADDING) * newScale;

        setPan({ x, y });
    }, [containerRef.current, layout, setPan]);

    useEffect(center, [center]);

    const handleMouseDown = (event: React.MouseEvent) => {
        if (event.button !== 0 || !containerRef.current || !layout) return;
        setIsPanning(true);

        const rect = containerRef.current.getBoundingClientRect();
        let x = (event.clientX - rect.left + pan.x) / scaleMap(scale);
        let y = (event.clientY - rect.top + pan.y) / scaleMap(scale);

        x = x * scaleMap(viewport.scale) - viewport.size.x / 2;
        y = y * scaleMap(viewport.scale) - viewport.size.y / 2;

        const scaleRatio = scaleMap(scale) / scaleMap(viewport.scale);
        setStartPan({
            x: x - event.clientX / scaleRatio,
            y: y - event.clientY / scaleRatio,
        });
    };

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, [setIsPanning]);

    const handleMouseMove = (event: React.MouseEvent) => {
        if (isPanning) {
            const scaleRatio = scaleMap(scale) / scaleMap(viewport.scale);
            viewport.setPan({
                x: startPan.x + event.clientX / scaleRatio,
                y: startPan.y + event.clientY / scaleRatio,
            });
        }
    };

    // Gets the size of the SVG
    useEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setSvgSize({ width: rect.width, height: rect.height });
    }, [scale, containerRef.current, setSvgSize, scaleMap]);

    // Size observer
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(([entry]) => {
            setSvgSize({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            });
            center();
        });

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [containerRef.current, center, setSvgSize]);

    // The size of the viewport
    const ViewPortX = Math.max(pan.x / scaleMap(scale), viewport.pan.x / scaleMap(viewport.scale)) * scaleMap(scale);
    const ViewPortY = Math.max(pan.y / scaleMap(scale), viewport.pan.y / scaleMap(viewport.scale)) * scaleMap(scale);

    const ViewPortWidth =
        Math.min(
            (pan.x + svgSize.width) / scaleMap(scale),
            (viewport.pan.x + viewport.size.x) / scaleMap(viewport.scale)
        ) *
            scaleMap(scale) -
        ViewPortX;
    const ViewPortHeight =
        Math.min(
            (pan.y + svgSize.height) / scaleMap(scale),
            (viewport.pan.y + viewport.size.y) / scaleMap(viewport.scale)
        ) *
            scaleMap(scale) -
        ViewPortY;

    return (
        <div
            className="relative w-full h-auto aspect-square"
            ref={containerRef}
            data-vscode-context='{"preventDefaultContextMenuItems": true}'
        >
            <div
                className="absolute top-0 left-0 h-full w-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <svg
                    width={svgSize.width}
                    height={svgSize.height}
                    preserveAspectRatio="xMinYMin"
                    className="absolute top-0 left-0 overflow-hidden"
                    viewBox={`${pan.x} ${pan.y} ${svgSize.width} ${svgSize.height}`}
                    style={{
                        cursor: isPanning ? "grabbing" : "grab",
                    }}
                >
                    <defs>
                        <mask id="clip">
                            <rect x={pan.x} y={pan.y} width={svgSize.width} height={svgSize.height} fill="#999" />
                            <rect
                                x={ViewPortX}
                                y={ViewPortY}
                                width={ViewPortWidth}
                                height={ViewPortHeight}
                                fill="#000"
                            />
                        </mask>
                    </defs>

                    <g transform={`scale(${scaleMap(scale)})`}>
                        {layout &&
                            [...layout.blocks].map(([name, block], idx) => (
                                <rect
                                    key={idx}
                                    x={block.x}
                                    y={block.y}
                                    width={block.width}
                                    height={block.height}
                                    fill={
                                        name === selected.name
                                            ? "var(--vscode-focusBorder)"
                                            : "var(--vscode-foreground)"
                                    }
                                />
                            ))}
                    </g>

                    <rect
                        x={pan.x}
                        y={pan.y}
                        width={svgSize.width}
                        height={svgSize.height}
                        fill="#000"
                        mask="url(#clip)"
                    />
                    <rect
                        x={ViewPortX}
                        y={ViewPortY}
                        width={ViewPortWidth}
                        height={ViewPortHeight}
                        fill="transparent"
                        stroke="var(--vscode-focusBorder)"
                    />
                </svg>
            </div>
        </div>
    );
};

export default Minimap;
