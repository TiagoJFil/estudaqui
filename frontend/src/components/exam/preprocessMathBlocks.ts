/**
 * Final robust version: Preprocesses mathematical blocks in a given text for Markdown+LaTeX rendering.
 * Handles all edge cases: block/inline confusion, splitting, context, and leftover LaTeX commands.
 */
export default function preprocessMathBlocks(text: string): string {
  // 1. Extract all block math (\[...\], [...], $$...$$) and replace with placeholders
  // Block math: must be on its own line, can be multi-line, allow for indented blocks
  const blockMathRegex = /(?:^|\n)[ \t]*((?:\\\[|\[|\$\$)[ \t]*\n?[\s\S]*?[ \t]*\n?(?:\\\]|\]|\$\$))[ \t]*(?=\n|$)/gm;
  const blockMaths: string[] = [];
  let blockIdx = 0;
  text = text.replace(blockMathRegex, (match, block) => {
    // Remove delimiters and trim
    let content = block
      .replace(/^\\\[|^\[|^\$\$|\\\]$|\]$|\$\$$/gm, '')
      .trim();
    blockMaths.push(content);
    return `\n@@BLOCKMATH${blockIdx++}@@\n`;
  });

  // 2. Replace inline math: \(...\) and $...$ (but not $$...$$)
  // Only replace $...$ if not surrounded by word characters (avoid $word$)
  // Avoid splitting variable names or function calls
  text = text.replace(/\\\((.+?)\\\)/g, (m, p1) => `$${p1.trim()}$`);
  text = text.replace(/\$(?!\$)([^\n$]+?)\$(?!\$)/g, (m, p1, offset, str) => {
    // Don't replace if inside a word (e.g., a$word$z)
    const before = str[offset - 1];
    const after = str[offset + m.length];
    if ((before && /[\w]/.test(before)) || (after && /[\w]/.test(after))) {
      return m;
    }
    return `$${p1.trim()}$`;
  });

  // 3. Restore block math, ensuring each is on its own line and wrapped with $$ ... $$
  text = text.replace(/@@BLOCKMATH(\d+)@@/g, (m, idx) => {
    const content = blockMaths[Number(idx)];
    // Ensure block math is surrounded by exactly one blank line before and after
    return `\n\n$$\n${content}\n$$\n\n`;
  });

  // 4. Clean up: Remove accidental double $$, empty blocks, and trim excessive newlines
  text = text.replace(/\$\$\s*\$\$/g, '$$'); // Remove empty blocks
  text = text.replace(/\n{3,}/g, '\n\n'); // No more than 2 newlines
  text = text.replace(/\s+\$\$/g, '\n$$'); // Ensure block math starts on its own line
  text = text.replace(/\$\$\s+/g, '$$\n'); // Ensure block math ends on its own line
  text = text.replace(/\n{2,}\$\$/g, '\n$$');
  text = text.replace(/\$\$\n{2,}/g, '$$\n');

  // 5. Remove any leftover LaTeX delimiters (\[ \], \( \)), and fix \text, \frac, etc. if not inside math
  // Remove stray LaTeX commands outside math
  text = text.replace(/([^$])\\(text|frac|cdot|left|right|overline|underline|bar|vec|hat|tilde|dot|ddot|mathbb|mathcal|mathrm|mathbf|mathit|mathsf|mathtt|mathfrak|mathscr|mathring|mathnormal|mathop|mathrel|mathbin|mathord|mathpunct|mathopen|mathclose|mathinner|mathaccent|mathchoice|mathpalette|mathsmash|mathstrut|mathsurround|mathversion|mathchar|mathgroup|mathcode|mathchardef|mathcode|mathaccentdef|mathopdef|mathbinopdef|mathrelopdef|mathopenopdef|mathcloseopdef|mathpunctopdef|mathinneropdef|mathalpha|mathbeta|mathgamma|mathdelta|mathepsilon|mathzeta|matheta|mathiota|mathkappa|mathlambda|mathmu|mathnu|mathxi|mathomicron|mathpi|mathrho|mathsigma|mathtau|mathupsilon|mathphi|mathchi|mathpsi|mathomega|mathGamma|mathDelta|mathTheta|mathLambda|mathXi|mathPi|mathSigma|mathUpsilon|mathPhi|mathPsi|mathOmega)\b/g, '$1');

  // 6. Post-process: wrap lines that are pure math (start with '=' and contain LaTeX, or are indented and contain LaTeX) with $...$ if not already in math
  text = text.split('\n').map(line => {
    // If line is already inside block math, skip
    if (/^\s*\$\$/.test(line) || /\$\s*$/.test(line)) return line;
    const trimmed = line.trim();
    // Starts with '=' and contains LaTeX, wrap in $...$
    if (/^=/.test(trimmed) && /\\[a-zA-Z]+/.test(trimmed)) {
      return `$${trimmed}$`;
    }
    // Indented and contains LaTeX, and is otherwise only math symbols
    if (/^\s{2,}/.test(line) && /\\[a-zA-Z]+/.test(trimmed) && /^[=()0-9+\-*/^_ .\\a-zA-Z]+$/.test(trimmed)) {
      return `$${trimmed}$`;
    }
    return line;
  }).join('\n');

  // 7. Final trim
  return text.trim();
}