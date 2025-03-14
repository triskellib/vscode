/**
 * Namespace containing all regexps for parsing LLVM IR
 */
export namespace Regexp {
    // Fragments

    /**
     * Standard identifier from https://llvm.org/docs/LangRef.html#identifiers
     */
    const identifierFrag = xstr(`(
        [-a-zA-Z$._][-a-zA-Z$._0-9]*|   # Standard Identifier Regex
        ".*?"                           # Quoted identifier
    )`);

    /**
     * Matches global identifiers
     */
    const globalVarFrag = `@(${identifierFrag}|\\d+)`;

    /**
     * Matches local identifiers
     */
    const allLocalVarFrag = xstr(`%(
        ${identifierFrag}|  # Named identifiers
        \\d+                # Anonymous identifiers
    )`);

    /**
     * Matches attributes
     */
    const attributeGroupFrag = "#\\d+";

    /**
     * Matches metadata
     */
    const metadataFrag = `!(${identifierFrag}|\\d+)`;

    /**
     * Vacuum up all identifiers by "OR-ing" all of them
     */
    const allIdentifiersFrag = xstr(`(
        ${globalVarFrag}|           # Global Identifiers
        ${allLocalVarFrag}|         # Local variables
        ${attributeGroupFrag}|      # Attributes
        ${metadataFrag}             # Metadata
    )`);

    // Regexes

    /**
     * Generic identifier regex, without named capture
     * Used with getWordRangeAtPosition
     */
    export const identifier = new RegExp(`${allIdentifiersFrag}`);

    /**
     * Matches an identifier or a label
     */
    export const identifierOrLabel = xre(
        `(
            ${allIdentifiersFrag}|      # Normal identifier
            (${identifierFrag}|\\d+):   # Label identifier
        )`
    );

    /**
     * We consider an assignment an identifier followed by a '='
     * Since the named capture 'value' is first it will have precedence
     * otherwise it is a reference it will show up in the named caputure 'user'
     */
    export const valueOrUser = xre(
        `(
            (?<value>${allIdentifiersFrag})\\s*=|       # Assignments are captured first if applicable
            (?<user>${allIdentifiersFrag})(\\*|)        # Otherwise grab identifiers as uses
        )`,
        "g"
    );

    /**
     * We take all locals followed optionally by a comma
     * This is used in function declarations to grab
     * the 'assignment' of the function's parameters
     */
    export const argument = xre(
        `
            (?<value>${allLocalVarFrag})    # Capture local variables in the 'value' capture
            \\s*                            # Whitespace can follow
            (,|$)                           # Must end with a comma or end of string
        `,
        "g"
    );

    /**
     * Labels are matched inside the 'label' capture
     */
    export const label = xre(`
        ^                                       # Match start of line
        (?<label>(${identifierFrag}|\\d+))      # Grab identifier
        :                                       # Must be followed by :
    `);

    /**
     * We capture function name to 'funcid'
     * and the arguments to 'args'
     * 'open' if present means that the function has a body
     */
    export const define = xre(`
        ^define.*                       # Line must start with 'define'
        (?<funcid>${globalVarFrag})     # Capture function name in 'funcid'
        \\(                             # Match open parenthesis for arguments
            (?<args>.*)                 # Grab in 'args' everything contained within greedily
        \\)                             # Match the close parenthesis
        (?<funcmeta>.*)                 # Capture function metadata
        \\s*$                           # after that there should be only whitespace
    `);

    /**
     * Capture declarations, ignoring arguments
     */
    export const declare = xre(`
        ^declare.*                      # Line starts with declare
        (?<funcid>${globalVarFrag})     # Grab identifier
        \\(.*\\).*$                     # There needs to be the '(' to avoid the identifier
                                        # Being included in the '.*'
    `);

    /**
     * Match the closing bracket of a function body
     */
    export const close = new RegExp("^\\s*}\\s*$");

    /**
     * Capture boolean literals
     */
    export const booleanLiteralFrag = xstr(`(true|false|0|1)`);

    /**
     * Captures a numeric literal
     */
    export const numericLiteralFrag = xstr(`(\\d+|${booleanLiteralFrag})`);

    /**
     * Capture conditional branch instructions
     */
    export const conditionalBranchInstruction = xre(`
        ^\\s*
        br\\s+
        i1\\s+(?<condition>.*)\\s*,
        \\s*label\\s+(?<iftrue>${allLocalVarFrag})\\s*,
        \\s*label\\s+(?<iffalse>${allLocalVarFrag})
        .*
    `);

    /**
     * Capture unconditional branch instructions
     */
    export const unconditionalBranchInstruction = xre(`
        ^\\s*
        br\\s+
        label\\s+(?<target>${allLocalVarFrag})
        .*
    `);

    /**
     * Match an integer type
     * TODO:
     */
    export const intty = xre(`.*`);

    /**
     * Part of a switch case
     */
    export const switchCases = xre(
        `
            (?<value>${numericLiteralFrag})
            \\s*,\\s*
            label\\s+(?<target>${allLocalVarFrag})
      `,
        "mg"
    );

    /**
     * Capture the beginning of the  switch instructions
     */
    export const switchInstruction = xre(`
            ^\\s*
            switch\\s+
            .*\\s+(?<value>.*)\\s*,
            \\s*label\\s+(?<default>${allLocalVarFrag})
            \\s*\\[
      `);

    /**
     * Part of a indirectbr
     */
    export const indirectBrLabel = xre(
        `
            label\\s+(?<target>${allLocalVarFrag})\\s*,?
      `,
        "mg"
    );

    /**
     * Capture the beginning of the indirectbr instructions
     */
    export const indirectBr = xre(`
            indirectbr\\s+
            ptr\\s+(?<value>.*)\\s*,
            \\s*\\[
      `);

    /**
     * Capture other terminator instructions
     */
    export const otherTerminatorInstruction = xre(`
        (?<opcode>(ret|indirectbr|invoke|callbr|resume|catchswitch|catchret|cleanupret|unreachable))
    `);
}

/**
 * Given a string returns the string with
 * comments (from # onward) removed and the line trimmed
 * @param input input string
 * @returns cleaned string
 */
function xstr(input: string): string {
    let res = "";
    for (const line of input.split("\n")) {
        const components = line.split("#");
        if (components.length > 1) {
            components.pop();
        }
        res += components.join("#").trim();
    }
    return res;
}

/**
 * Same as xstr but compile to regex instead
 * @param input input string
 * @param flags? regex flags as in RegExp
 * @returns compiled regex
 */
function xre(input: string, flags?: string | undefined): RegExp {
    const re = new RegExp(xstr(input), flags);
    return re;
}
