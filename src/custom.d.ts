declare module "*.wasm" {
    const value: string;
    export default value;
}

declare module "*.svg" {
    import React from "react";
    export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
    export default ReactComponent;
}
