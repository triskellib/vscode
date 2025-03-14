import { normalizeIdentifier } from "./common";
import { Regexp } from "./regexp";
import { Function, Module, BasicBlock } from "./cfg";

export const parse = (document: string): Module => {
    const module: Module = new Module();

    let lastFunction: Function | undefined;
    let lastBlock: BasicBlock | undefined;

    const lines = document.split("\n");

    for (let i = 0; i < lines.length; i++) {
        // Split at the first ';' to exclude comments
        const line = lines[i].split(";", 2)[0];

        if (line === "") {
            continue;
        }

        const defineMatch = line.match(Regexp.define);
        if (defineMatch !== null && defineMatch.index !== null && defineMatch.groups !== undefined) {
            const funcid = defineMatch.groups["funcid"];
            lastFunction = new Function(module, funcid);
            lastBlock = new BasicBlock(lastFunction, "entry");
            continue;
        }

        const labelMatch = line.match(Regexp.label);
        if (labelMatch !== null && labelMatch.index !== undefined && labelMatch.groups !== undefined) {
            console.assert(lastFunction !== undefined, "Label found outside of function definition");
            const block_name = normalizeIdentifier(`%${labelMatch.groups["label"]}`);

            // If this is the first block in the function, replace entry
            if (lastFunction!.basicBlocks.size === 1 && lastBlock!.instructions.length === 0) {
                lastFunction!.basicBlocks.clear();
                lastFunction!.root = undefined;
            } else {
                console.assert(lastBlock === undefined, "Label found before terminator instruction");
            }

            lastBlock = new BasicBlock(lastFunction!, block_name);
            continue;
        }

        const closeMatch = line.match(Regexp.close);
        if (closeMatch !== null) {
            console.assert(lastFunction !== undefined, "Function end found outside of function definition");
            console.assert(lastBlock === undefined, "Function ended before terminator instruction");

            lastBlock = undefined;
            lastFunction = undefined;
            continue;
        }

        if (lastBlock !== undefined) {
            const [terminated, j] = lastBlock.addInstruction(i, line, lines);
            i = j;

            if (terminated) {
                lastBlock = undefined;
            }
        }
    }

    return module;
};
