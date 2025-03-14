import { useState, useEffect } from "react";
import { EmbindModule } from "../triskel/triskel-wasm";

const useWasm = () => {
    const [wasmModule, setWasmModule] = useState<EmbindModule | undefined>(undefined);

    useEffect(() => {
        console.log("LOADING WASM");
        // @ts-ignore
        window.Module = {};
        // @ts-ignore
        window.Module.onRuntimeInitialized = async () => {
            console.log("LOADED WASM");
            // @ts-ignore
            setWasmModule(window.Module);
        };

        // Dynamically load the WebAssembly script
        const script = document.createElement("script");
        // @ts-ignore
        script.src = window.__WASM_URL__; // Ensure the path is correct
        script.async = true;
        script.onload = () => console.log("✅ WASM Script Loaded");

        document.body.appendChild(script);

        // Cleanup function to remove the script
        return () => {
            document.body.removeChild(script);
            // @ts-ignore
            delete window.Module;
        };
    }, [setWasmModule]);

    return [wasmModule];
};

export default useWasm;
