import { MathJax, MathJaxContext } from "better-react-mathjax";

interface LatexRendererProps {
  children: string;
}

const mathJaxConfig = {
  loader: { load: ["[tex]/ams"] },
  tex: {
    packages: { '[+]': ["ams"] },
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"]
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"]
    ]
  }
};

/**
 * Renders text with LaTeX math using MathJax.
 * Handles block math ($$...$$, \[...\]), inline math ($...$, \(...\)), and mixed content.
 */
export const SuggestedAnswerDisplay = ({ children }: LatexRendererProps) => {
  if (!children) return null;
  const text = children;

  // Regex to match block and inline math (non-greedy)
  const mathRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+\$|\\\([^\)]+\\\))/g;

  // Split text into parts: math and non-math
  const parts: { type: 'math' | 'text'; value: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let regex = new RegExp(mathRegex);
  while ((match = mathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'math', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      {parts.map((part, idx) => {
        if (part.type === 'math') {
          const math = part.value;
          // Block math: $$...$$ or \[...\]
          if (/^\$\$[\s\S]+\$\$$/.test(math)) {
            return <MathJax key={idx} inline={false}>{math.slice(2, -2)}</MathJax>;
          }
          if (/^\\\[[\s\S]+\\\]$/.test(math)) {
            return <MathJax key={idx} inline={false}>{math.slice(2, -2)}</MathJax>;
          }
          // Inline math: $...$ or \(...\)
          if (/^\$[^$\n]+\$$/.test(math)) {
            return <MathJax key={idx} inline={true}>{math.slice(1, -1)}</MathJax>;
          }
          if (/^\\\([^\)]+\\\)$/.test(math)) {
            return <MathJax key={idx} inline={true}>{math.slice(2, -2)}</MathJax>;
          }
        }
        // Plain text
        return part.value ? <span key={idx} className="whitespace-pre-wrap">{part.value}</span> : null;
      })}
    </MathJaxContext>
  );
};
