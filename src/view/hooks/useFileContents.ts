import { useState, useEffect } from "react";
import vscode from "../vscode";

const useFileContents = () => {
    const [fileContent, setFileContent] = useState<string | undefined>(undefined);

    useEffect(() => {
        const handleMessage = (event: any) => {
            console.log(event.data);

            const message = event.data;
            if (message.command === "setFileContent") {
                setFileContent(message.text);
            }
        };

        window.addEventListener("message", handleMessage);

        return () => window.removeEventListener("message", handleMessage);
    }, [setFileContent]);

    useEffect(() => {
        vscode.postMessage({ command: "getFileContent" });
    }, []);

    return fileContent;
};

export default useFileContents;
