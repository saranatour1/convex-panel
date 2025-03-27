type Identifier = string;
type LineNumber = number;

// Match the original declaration of a variable.
const definitionRegex = /^var ([a-zA-Z0-9_]+) =/;

// Match a one line export.
const onelineExportRegex = /^export \{([a-zA-Z0-9_, ]+)\};$/;
const onelineItemRegex = /^([a-zA-Z0-9_]+)( as [a-zA-Z0-9_]+)?$/;

// Match a line in the `export` block at the end of an esbuild bundle.
const exportRegex = /^([a-zA-Z0-9_]+)( as [a-zA-Z0-9_]+)?,?$/;

// Match raw source code exports
const rawExportRegex = /^export (?:const|function) ([a-zA-Z0-9_]+)/;
const rawExportArrowRegex = /^export const ([a-zA-Z0-9_]+) =/;

export function findLineNumbers(
  source: string,
  expectedExports: Identifier[],
): Map<Identifier, LineNumber> {
  const lines = source.split("\n").map((l) => l.trim());
  const result = new Map<string, number>();

  // First try to find raw source code exports
  Array.from(lines.entries()).forEach(([index, line]) => {
    const lineno = index + 1;
    const rawMatch = line.match(rawExportRegex) || line.match(rawExportArrowRegex);
    if (rawMatch && expectedExports.includes(rawMatch[1])) {
      result.set(rawMatch[1], lineno);
    }
  });

  // If we found all exports, return early
  if (expectedExports.every(exp => result.has(exp))) {
    return result;
  }

  // Otherwise try bundled code patterns
  let foundExport = false;
  const exportMap = new Map<string, string>();

  // Look for oneline exports first
  lines.forEach(line => {
    const onelineMatch = line.match(onelineExportRegex);
    if (onelineMatch) {
      const pieces = onelineMatch[1].split(",").map((l) => l.trim());
      pieces.forEach(piece => {
        const itemMatch = piece.match(onelineItemRegex);
        if (!itemMatch) {
          console.warn(`Item ${piece} in ${line} didn't match item regex`);
          return;
        }
        const origIdentifier = itemMatch[1];
        const exportIdentifier = itemMatch[2]
          ? itemMatch[2].slice(" as ".length)
          : origIdentifier;
        exportMap.set(exportIdentifier, origIdentifier);
      });
    }
  });

  // Look for multi-line export block
  lines.forEach(line => {
    if (line === "export {") {
      foundExport = true;
      return;
    }
    if (foundExport && line === "};") {
      foundExport = false;
      return;
    }
    if (!foundExport) {
      return;
    }
    const exportMatch = line.match(exportRegex);
    if (!exportMatch) {
      console.warn(`Line ${line} did not match export regex`);
      return;
    }
    const origIdentifier = exportMatch[1];
    const exportIdentifier = exportMatch[2]
      ? exportMatch[2].slice(" as ".length)
      : origIdentifier;
    exportMap.set(exportIdentifier, origIdentifier);
  });

  // Find bundled declarations
  const lineNumbers = new Map<string, number>();
  Array.from(lines.entries()).forEach(([index, line]) => {
    const lineno = index + 1;
    const definitionMatch = line.match(definitionRegex);
    if (!definitionMatch) {
      return;
    }
    const origIdentifier = definitionMatch[1];
    lineNumbers.set(origIdentifier, lineno);
  });

  // Stitch the bundled relations together
  expectedExports.forEach(exported => {
    if (result.has(exported)) {
      return; // Skip if we already found it in raw source
    }
    const origIdentifier = exportMap.get(exported);
    if (origIdentifier === undefined) {
      console.warn(`Couldn't find export ${exported} in `, exportMap);
      return;
    }
    const lineNumber = lineNumbers.get(origIdentifier);
    if (lineNumber === undefined) {
      console.warn(
        `Couldn't find line number for ${exported} -> ${origIdentifier} in `,
        lineNumbers,
      );
      return;
    }
    result.set(exported, lineNumber);
  });

  return result;
} 