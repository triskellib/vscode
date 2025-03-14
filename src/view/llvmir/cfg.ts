/// A type for the AST of LLVM IR

import { Regexp } from "./regexp";

export type AST = {
    module: Module;
};

export class Module {
    functions: Map<string, Function> = new Map();
}

export class Function {
    basicBlocks: Map<string, BasicBlock> = new Map();
    root: string | undefined = undefined;

    constructor(public module: Module, public name: string) {
        module.functions.set(name, this);
    }
}

export class Edge {
    constructor(public from: string, public to: string, public type: "true" | "false" | "none" = "none") {}
}

export class BasicBlock {
    instructions: Instruction[] = [];

    successors: Edge[] = [];

    first_address: number | undefined = undefined;

    constructor(public fun: Function, public name: string) {
        fun.basicBlocks.set(name, this);
        if (fun.root === undefined) {
            fun.root = name;
        }
    }

    addEdge(to: string, type: "true" | "false" | "none" = "none") {
        this.successors.push(new Edge(this.name, to, type));
    }

    /**
     * Add an instruction to the basic block
     * @param insn The instruction to add
     * @returns True if the instruction is a terminator instruction
     */
    addInstruction(line_nb: number, insn: string, lines: string[]): [boolean, number] {
        if (this.first_address === undefined) this.first_address = line_nb;
        else this.first_address = Math.min(this.first_address, line_nb);

        const conditionalBranchMatch = insn.match(Regexp.conditionalBranchInstruction);
        if (insn.startsWith("  br i1")) console.log([...insn], conditionalBranchMatch);
        if (conditionalBranchMatch !== null && conditionalBranchMatch.groups !== undefined) {
            console.log("Found a branch", insn);
            const conditional = conditionalBranchMatch.groups["conditional"];
            const iftrue = conditionalBranchMatch.groups["iftrue"];
            const iffalse = conditionalBranchMatch.groups["iffalse"];
            const branchInstruction = new ConditionalBranchInstruction(
                conditional,
                new Label(iftrue),
                new Label(iffalse),
                insn,
                line_nb + 1
            );
            this.instructions.push(branchInstruction);

            this.addEdge(iftrue, "true");
            this.addEdge(iffalse, "false");
            return [false, line_nb];
        }

        const unconditionalBranchMatch = insn.match(Regexp.unconditionalBranchInstruction);
        if (unconditionalBranchMatch !== null && unconditionalBranchMatch.groups !== undefined) {
            const target = unconditionalBranchMatch.groups["target"];
            const branchInstruction = new UnconditionalBranchInstruction(new Label(target), insn, line_nb + 1);
            this.instructions.push(branchInstruction);

            this.addEdge(target);
            return [false, line_nb];
        }

        const switchMatch = insn.match(Regexp.switchInstruction);
        if (switchMatch !== null && switchMatch.groups !== undefined) {
            const value = switchMatch.groups["value"];
            const defaultTarget = switchMatch.groups["default"];

            this.addEdge(defaultTarget);

            let extended_insn = insn;
            const initial_line_nb = line_nb;
            while (extended_insn.indexOf("]") == -1) {
                line_nb += 1;
                extended_insn += "\n" + lines[line_nb];
            }

            const targetMatches = [...extended_insn.substring(switchMatch[0].length).matchAll(Regexp.switchCases)];

            let targets: { value: string; target: Label }[] = [];

            for (let j = 1; j < targetMatches.length; ++j) {
                const value = targetMatches[j].groups!["value"];
                const target = targetMatches[j].groups!["target"];
                targets.push({
                    value,
                    target: new Label(target),
                });

                this.addEdge(target);
            }

            this.instructions.push(
                new SwitchInstruction(value, new Label(defaultTarget), targets, extended_insn, initial_line_nb + 1)
            );
            return [false, line_nb];
        }

        const indirectBrMatch = insn.match(Regexp.indirectBr);
        if (indirectBrMatch !== null && indirectBrMatch.groups !== undefined) {
            let s = insn.substring(indirectBrMatch[0].length);
            while (s.indexOf("]") == -1) {
                line_nb += 1;
                s += lines[line_nb];
            }

            const targetMatches = [...s.matchAll(Regexp.indirectBrLabel)];

            for (let j = 1; j < targetMatches.length; ++j) {
                const target = targetMatches[j].groups!["target"];
                this.addEdge(target);
            }

            this.instructions.push(new TerminatorInstruction("indirectbr", insn, line_nb + 1));
            return [false, line_nb];
        }

        const otherTerminatorMatch = insn.match(Regexp.otherTerminatorInstruction);
        if (otherTerminatorMatch !== null && otherTerminatorMatch.groups !== undefined) {
            this.instructions.push({
                opcode: otherTerminatorMatch.groups["opcode"],
                content: insn,
                group: "Terminator",
                address: line_nb + 1,
            });
            return [false, line_nb];
        }

        this.instructions.push({ opcode: "", content: insn, group: "Other", address: line_nb + 1 });

        return [false, line_nb];
    }
}

export interface Instruction {
    opcode: string;
    content: string;
    group: "Terminator" | "Other";
    address: number;
}

export class TerminatorInstruction implements Instruction {
    readonly group = "Terminator";

    constructor(
        public opcode:
            | "ret"
            | "br"
            | "switch"
            | "invoke"
            | "indirectbr"
            | "callbr"
            | "resume"
            | "catchswitch"
            | "catchret"
            | "cleanupret"
            | "unreachable",
        public content: string,
        public address: number
    ) {}
}

export class Label {
    constructor(public name: string) {}
}

export class BranchInstruction extends TerminatorInstruction {
    constructor(public conditional: boolean, public content: string, public address: number) {
        super("br", content, address);
    }
}

export class ConditionalBranchInstruction extends BranchInstruction {
    readonly conditional = true;

    constructor(
        public condition: string,
        public iftrue: Label,
        public iffalse: Label,
        public content: string,
        public address: number
    ) {
        super(true, content, address);
    }
}

export class UnconditionalBranchInstruction extends BranchInstruction {
    readonly conditional = false;

    constructor(public target: Label, public content: string, public address: number) {
        super(false, content, address);
    }
}

export class SwitchInstruction extends TerminatorInstruction {
    constructor(
        public value: string,
        public defaultTarget: Label,
        public targets: { value: string; target: Label }[],
        public content: string,
        public address: number
    ) {
        super("switch", content, address);
    }
}
