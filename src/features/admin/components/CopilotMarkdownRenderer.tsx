import React from 'react';

interface CopilotMarkdownRendererProps {
  content: string;
}

interface ContentBlock {
  id: string;
  type: 'code' | 'line';
  text: string;
}

function cleanMath(raw: string): string {
  return raw
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\approx/g, '≈')
    .replace(/\\leq?/g, '≤')
    .replace(/\\geq?/g, '≥')
    .replace(/\\pm/g, '±')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\\_/g, '_')
    .replace(/\\/g, '')
    .trim();
}

function sanitizePlainText(text: string): string {
  return text.replace(/\\text\{([^}]+)\}/g, '$1').replace(/\\([a-zA-Z]+)/g, '');
}

function formatInlinePiece(matchText: string, tokenKey: string): React.ReactNode {
  if (
    (matchText.startsWith('$$') && matchText.endsWith('$$')) ||
    (matchText.startsWith('\\[') && matchText.endsWith('\\]'))
  ) {
    const raw = matchText.startsWith('$$') ? matchText.slice(2, -2) : matchText.slice(2, -2);
    return (
      <span
        key={tokenKey}
        className="block my-1.5 p-2 rounded bg-slate-950 border border-amber-500/30 text-amber-300 font-mono text-[11px] text-center font-medium shadow-inner overflow-x-auto"
      >
        {cleanMath(raw)}
      </span>
    );
  }

  if (
    (matchText.startsWith('$') && matchText.endsWith('$')) ||
    (matchText.startsWith('\\(') && matchText.endsWith('\\)'))
  ) {
    const raw = matchText.startsWith('$') ? matchText.slice(1, -1) : matchText.slice(2, -2);
    return (
      <span
        key={tokenKey}
        className="font-mono bg-amber-950/40 text-amber-300 border border-amber-700/50 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide inline-block my-0.5"
      >
        {cleanMath(raw)}
      </span>
    );
  }

  if (matchText.startsWith('**') && matchText.endsWith('**')) {
    return (
      <strong key={tokenKey} className="font-bold text-amber-300">
        {matchText.slice(2, -2)}
      </strong>
    );
  }

  if (matchText.startsWith('`') && matchText.endsWith('`')) {
    return (
      <code
        key={tokenKey}
        className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-amber-400 text-[10px]"
      >
        {matchText.slice(1, -1)}
      </code>
    );
  }

  if (matchText.startsWith('*') && matchText.endsWith('*')) {
    return (
      <em key={tokenKey} className="italic text-slate-300">
        {matchText.slice(1, -1)}
      </em>
    );
  }

  return sanitizePlainText(matchText);
}

function renderInlineFormatted(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\)|\$[^$\n]+?\$|\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(sanitizePlainText(text.slice(lastIndex, match.index)));
    }

    const tokenKey = `token-${match.index}-${match[0].slice(0, 4)}`;
    parts.push(formatInlinePiece(match[0], tokenKey));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(sanitizePlainText(text.slice(lastIndex)));
  }

  return parts.length > 0 ? parts : sanitizePlainText(text);
}

function parseBlocks(content: string): ContentBlock[] {
  const lines = content.split('\n');
  const blocks: ContentBlock[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let blockCounter = 0;

  for (const line of lines) {
    blockCounter += 1;
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          id: `code-${blockCounter}`,
          type: 'code',
          text: codeBuffer.join('\n'),
        });
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
    } else {
      blocks.push({
        id: `line-${blockCounter}`,
        type: 'line',
        text: line,
      });
    }
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      id: `code-${blockCounter}`,
      type: 'code',
      text: codeBuffer.join('\n'),
    });
  }

  return blocks;
}

function renderSingleLine(trimmed: string, blockId: string): React.ReactNode {
  if (!trimmed) {
    return <div key={blockId} className="h-1" />;
  }

  if (trimmed.startsWith('### ')) {
    return (
      <h4 key={blockId} className="font-bold text-xs text-amber-400 mt-2 mb-0.5">
        {renderInlineFormatted(trimmed.slice(4))}
      </h4>
    );
  }

  if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
    return (
      <h3 key={blockId} className="font-black text-xs text-white mt-2 mb-0.5 tracking-tight">
        {renderInlineFormatted(trimmed.replace(/^#+\s/, ''))}
      </h3>
    );
  }

  if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    return (
      <div key={blockId} className="flex items-start gap-1.5 pl-1.5">
        <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
        <span className="flex-1">{renderInlineFormatted(trimmed.slice(2))}</span>
      </div>
    );
  }

  const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
  if (numberedMatch) {
    return (
      <div key={blockId} className="flex items-start gap-1.5 pl-1.5">
        <span className="font-mono text-amber-400 font-bold text-[10px] shrink-0 mt-0.5">
          {numberedMatch[1]}.
        </span>
        <span className="flex-1">{renderInlineFormatted(numberedMatch[2])}</span>
      </div>
    );
  }

  return (
    <p key={blockId}>
      {renderInlineFormatted(trimmed)}
    </p>
  );
}

export function CopilotMarkdownRenderer({ content }: CopilotMarkdownRendererProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-1.5 leading-relaxed text-[11px] text-slate-200">
      {blocks.map((block) => {
        if (block.type === 'code') {
          return (
            <pre
              key={block.id}
              className="my-1.5 p-2 rounded bg-slate-950 border border-slate-800 text-amber-300 font-mono text-[10px] overflow-x-auto whitespace-pre leading-normal"
            >
              {cleanMath(block.text)}
            </pre>
          );
        }

        return renderSingleLine(block.text.trim(), block.id);
      })}
    </div>
  );
}

export default CopilotMarkdownRenderer;
