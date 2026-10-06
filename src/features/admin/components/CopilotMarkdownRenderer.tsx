import React from 'react';

interface CopilotMarkdownRendererProps {
  content: string;
}

export function CopilotMarkdownRenderer({ content }: CopilotMarkdownRendererProps) {
  const renderInlineFormatted = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const matchText = match[0];
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={`b-${match.index}`} className="font-bold text-amber-300">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code
            key={`c-${match.index}`}
            className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-amber-400 text-[10px]"
          >
            {matchText.slice(1, -1)}
          </code>
        );
      } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
        parts.push(
          <em key={`i-${match.index}`} className="italic text-slate-300">
            {matchText.slice(1, -1)}
          </em>
        );
      } else {
        parts.push(matchText);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-[11px] text-slate-200">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={`empty-${index}`} className="h-1" />;
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={`h3-${index}`} className="font-bold text-xs text-amber-400 mt-2 mb-0.5">
              {renderInlineFormatted(trimmed.slice(4))}
            </h4>
          );
        }

        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={`h2-${index}`} className="font-black text-xs text-white mt-2 mb-0.5 tracking-tight">
              {renderInlineFormatted(trimmed.replace(/^#+\s/, ''))}
            </h3>
          );
        }

        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={`bullet-${index}`} className="flex items-start gap-1.5 pl-1.5">
              <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{renderInlineFormatted(trimmed.slice(2))}</span>
            </div>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          return (
            <div key={`num-${index}`} className="flex items-start gap-1.5 pl-1.5">
              <span className="font-mono text-amber-400 font-bold text-[10px] shrink-0 mt-0.5">
                {numberedMatch[1]}.
              </span>
              <span className="flex-1">{renderInlineFormatted(numberedMatch[2])}</span>
            </div>
          );
        }

        return (
          <p key={`p-${index}`}>
            {renderInlineFormatted(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default CopilotMarkdownRenderer;
