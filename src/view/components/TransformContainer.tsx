import React, { useState, useRef, ReactNode, useCallback, useEffect, useContext } from "react";
import { LayoutContext, SelectedBlockContext, ViewPortContext } from "./context";
import EdgeView from "./EdgeView";

const PADDING = 200;

interface TransformContainerProps {
    children: ReactNode;
    width: number;
    height: number;
}

const TransformContainer = ({ children, width, height }: TransformContainerProps) => {
    const { scale, setScale, size, setSize, pan, setPan } = useContext(ViewPortContext);
    const layout = useContext(LayoutContext);
    const { selected, setSelected } = useContext(SelectedBlockContext);

    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });

    const scaleMap = useCallback((x: number) => x * x, []);

    const center = useCallback(() => {
        if (!containerRef.current) return;

        const paddedWidth = width + 2 * PADDING;
        const paddedHeight = height + 2 * PADDING;

        const rect = containerRef.current.getBoundingClientRect();
        const newScale = Math.max(Math.min(rect.width / paddedWidth, rect.height / paddedHeight, 1), 0.001);
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
    }, [containerRef.current, width, height, setPan]);

    useEffect(center, [center]);

    useEffect(() => {
        if (layout === undefined || !containerRef.current || !selected.shouldFocus) return;
        setSelected({ name: selected.name });

        const rect = containerRef.current.getBoundingClientRect();

        const block = layout.blocks.get(selected.name)!;

        const x = ((block.width + 2 * block.x) * scaleMap(scale) - rect.width) / 2;
        const y = ((block.height + 2 * block.y) * scaleMap(scale) - rect.height) / 2;
        setPan({ x, y });
    }, [containerRef.current, scale, selected, layout, setPan]);

    // Zoom while preserving the cursor position in world space
    const setScaleAndPos = useCallback(
        (newScale: number, clientX: number, clientY: number) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = clientX - rect.left;
            const mouseY = clientY - rect.top;

            const scaleRatio = scaleMap(newScale) / scaleMap(scale);

            // Adjust position to keep the mouse position fixed during zooming
            setPan({
                x: (mouseX + pan.x) * scaleRatio - mouseX,
                y: (mouseY + pan.y) * scaleRatio - mouseY,
            });

            setScale(newScale);
        },
        [containerRef, pan, setPan, scale, setScale]
    );

    const handleWheel = useCallback(
        (event: React.WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const newScale = Math.min(Math.max(scale - event.deltaY * 0.0005, 0.01), 1);
            setScaleAndPos(newScale, event.clientX, event.clientY);
        },
        [setScaleAndPos]
    );

    const handleMouseDown = useCallback(
        (event: React.MouseEvent) => {
            if (event.button !== 1 || !containerRef.current) return;
            setIsPanning(true);
            setStartPan({ x: pan.x + event.clientX, y: pan.y + event.clientY });
        },
        [pan, setIsPanning, setStartPan]
    );

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, [setIsPanning]);

    const handleMouseMove = useCallback(
        (event: React.MouseEvent) => {
            if (isPanning) {
                setPan({
                    x: startPan.x - event.clientX,
                    y: startPan.y - event.clientY,
                });
            }

            setLastMouse({ x: event.clientX, y: event.clientY });
        },
        [isPanning, startPan, setLastMouse]
    );

    useEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        setSize({ x: rect.width, y: rect.height });
    }, [scale, containerRef.current, setSize, scaleMap]);

    // Context menu
    useEffect(() => {
        const handler = (event: MessageEvent<any>) => {
            const message = event.data; // The JSON data our extension sent
            console.log(message);

            switch (message.command) {
                case "graph-commands.zoom": {
                    setScaleAndPos(1, lastMouse.x, lastMouse.y);
                    break;
                }

                case "graph-commands.center": {
                    center();
                    break;
                }

                case "basicblock-commands.center": {
                    setSelected({ name: message.block, shouldFocus: true });
                    break;
                }
            }
        };

        window.addEventListener("message", handler);

        return () => {
            window.removeEventListener("message", handler);
        };
    }, [setSelected, setScaleAndPos, center, containerRef, lastMouse]);

    useEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ x: rect.width, y: rect.height });
    }, [containerRef.current, setSize]);

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(([entry]) => {
            setSize({ x: entry.contentRect.width, y: entry.contentRect.height });
        });

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [containerRef.current, setSize]);

    // Mouse coordinates for display
    let mouseX = 0;
    let mouseY = 0;

    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();

        mouseX = Math.trunc((lastMouse.x + pan.x - rect.left) / scaleMap(scale));
        mouseY = Math.trunc((lastMouse.y + pan.y - rect.top) / scaleMap(scale));
    }

    return (
        <div
            className="relative h-full w-full"
            ref={containerRef}
            data-vscode-context='{"webviewSection": "graph-view", "preventDefaultContextMenuItems": true}'
        >
            <div
                className="absolute top-0 left-0 h-full w-full"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ backgroundColor: "var(--vscode-sideBar-background)" }}
            >
                <svg
                    width={size.x}
                    height={size.y}
                    preserveAspectRatio="xMinYMin"
                    className="absolute top-0 left-0 overflow-hidden"
                    viewBox={`${pan.x} ${pan.y} ${size.x} ${size.y}`}
                    style={{
                        cursor: isPanning ? "grabbing" : "grab",
                        backgroundColor: "var(--vscode-sideBar-background)",
                    }}
                >
                    {children}
                </svg>
            </div>
            <div>
                <p className="absolute left-0 bottom-0 z-10" style={{ color: "var(--vscode-foreground)" }}>
                    <span className="ml-1">
                        Mouse: ({mouseX}, {mouseY})
                    </span>

                    <span className="ml-5">Zoom: {Math.round(scaleMap(scale) * 100)}%</span>
                </p>
            </div>
        </div>
    );
};

export default TransformContainer;
