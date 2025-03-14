import * as vscode from "vscode";
import { Regexp } from "../view/llvmir/regexp";
import { normalizeIdentifier } from "../view/llvmir/common";
import path from "path";

let activeWebview: vscode.WebviewPanel | null = null;

let webviews: Map<string, vscode.WebviewPanel> = new Map();

function randomString(len = 32): string {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

const getHtmlForWebview = (webview: vscode.Webview, context: vscode.ExtensionContext) => {
    // Convert the styles and scripts for the webview into webview URIs
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "dist", "graph-viewer.js"));
    const wasmLoaderUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "dist", "triskel-wasm.js"));
    const codiconsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "node_modules", "@vscode/codicons", "dist", "codicon.css")
    );

    // Use a nonce to allow certain scripts to be run
    const nonce = randomString();

    webview.html = /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
            <head>
        		<meta charset="UTF-8">

        		<!--
        		Use a content security policy to only allow loading images from https or from our extension directory,
        		and only allow scripts that have a specific nonce.
        		-->

        		<meta name="viewport" content="width=device-width, initial-scale=1.0">

                <link rel="stylesheet" href="${codiconsUri}" id="vscode-codicon-stylesheet">

                <style>
                body {
                    margin: 0;
                    padding: 0;
                }
                </style>

                <title>Graph View</title>
            </head>
            <body style="padding-0">
                <div id="root"></div>
                <script nonce="${nonce}">const vscode = acquireVsCodeApi();</script>
                <script>
                    window.__WASM_URL__ = "${wasmLoaderUri}";
                </script>
                <script src="${scriptUri}"></script>
        	</body>
        </html>`;
};

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand("llvm-cfg.graph-commands.center", (e) => {
            if (!activeWebview) return;
            activeWebview.webview.postMessage({ command: "graph-commands.center" });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("llvm-cfg.graph-commands.zoom", (e) => {
            if (!activeWebview) return;
            activeWebview.webview.postMessage({ command: "graph-commands.zoom" });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("llvm-cfg.basicblock-commands.copy", (e) => {
            if (!activeWebview) return;
            activeWebview.webview.postMessage({ command: "basicblock-commands.copy", block: e.block });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("llvm-cfg.basicblock-commands.goto", (e) => {
            if (!activeWebview) return;
            activeWebview.webview.postMessage({ command: "basicblock-commands.goto", block: e.block });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("llvm-cfg.basicblock-commands.center", (e) => {
            if (!activeWebview) return;
            activeWebview.webview.postMessage({ command: "basicblock-commands.center", block: e.block });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("llvm-cfg.sync-views", (e) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const uri = editor.document.uri;

            const webview = webviews.get(uri.toString());
            if (!webview) {
                vscode.window.showErrorMessage("No graph view open");
                return;
            }
            webview.reveal(vscode.ViewColumn.Beside);

            let line_number = editor.selection.active.line;

            let block_name: string | undefined;
            let function_name: string | undefined;
            let lines = editor.document.getText().split("\n");
            while (line_number > 0) {
                const line = lines[line_number].split(";", 2)[0];

                const defineMatch = line.match(Regexp.define);
                if (defineMatch !== null && defineMatch.index !== null && defineMatch.groups !== undefined) {
                    if (block_name === undefined) {
                        block_name = "entry";
                    }

                    function_name = defineMatch.groups["funcid"];
                    break;
                }

                if (block_name === undefined) {
                    const labelMatch = line.match(Regexp.label);
                    if (labelMatch !== null && labelMatch.index !== undefined && labelMatch.groups !== undefined) {
                        block_name = normalizeIdentifier(`%${labelMatch.groups["label"]}`);
                    }
                }

                line_number--;
            }

            if (block_name === undefined || function_name === undefined) {
                vscode.window.showErrorMessage("Did not find block name or function name");
                return;
            }

            webview.webview.postMessage({ command: "sync", function_name, block_name });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("llvm-cfg.showPreview", async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== "llvm") {
                vscode.window.showErrorMessage("Open an .ll file to preview.");
                return;
            }

            const webview = webviews.get(editor.document.uri.toString());
            if (webview) {
                webview.reveal(vscode.ViewColumn.Beside);
                return;
            }

            const panel = vscode.window.createWebviewPanel(
                "llvm-cfg.graphView",
                `Graph View ${path.basename(editor.document.fileName)}`,
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(context.extensionUri, "dist"),
                        vscode.Uri.joinPath(context.extensionUri, "assets"),
                        vscode.Uri.joinPath(context.extensionUri, "node_modules", "@vscode/codicons", "dist"),
                    ],
                }
            );

            panel.iconPath = {
                light: vscode.Uri.joinPath(context.extensionUri, "assets", "triskel_black.svg"),
                dark: vscode.Uri.joinPath(context.extensionUri, "assets", "triskel_white.svg"),
            };

            webviews.set(editor.document.uri.toString(), panel);

            getHtmlForWebview(panel.webview, context);

            const content = await vscode.workspace.fs.readFile(editor.document.uri);
            const text = new TextDecoder().decode(content).replace(/\r\n/g, "\n");

            // Send the file content to the webview
            panel.webview.onDidReceiveMessage((msg: any) => {
                switch (msg.command) {
                    case "getFileContent": {
                        panel.webview.postMessage({
                            command: "setFileContent",
                            text,
                        });
                        break;
                    }

                    case "gotoLine": {
                        const line = Math.max(0, msg.line - 1); // Convert to 0-based index

                        const position = new vscode.Position(line, 0);
                        const selection = new vscode.Selection(position, position);
                        editor.selection = selection;

                        // Scroll to the line
                        editor.revealRange(selection, vscode.TextEditorRevealType.AtTop);

                        if (msg.moveFocus) {
                            vscode.window.showTextDocument(editor.document, editor.viewColumn);
                        }

                        break;
                    }

                    case "copy": {
                        (async () => {
                            await vscode.env.clipboard.writeText(msg.text);
                            vscode.window.showInformationMessage("Copied to clipboard!");
                        })();

                        break;
                    }
                }
            });

            const handleStateChange = () => {
                if (panel.active && panel.visible) {
                    activeWebview = panel;
                } else if (activeWebview === panel) {
                    activeWebview = null;
                }
            };
            panel.onDidChangeViewState(handleStateChange);
            handleStateChange();
        })
    );
}
