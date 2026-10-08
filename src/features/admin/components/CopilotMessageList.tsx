import { useEffect, useRef } from 'react';
import { Bot, User, Loader2 } from 'lucide-react';
import type { CopilotChatMessage } from '../agents/types';
import { CopilotMarkdownRenderer } from './CopilotMarkdownRenderer';
import { CopilotAgentBadge } from './CopilotAgentBadge';
import { CopilotTracePanel } from './CopilotTracePanel';

interface CopilotMessageListProps {
  messages: CopilotChatMessage[];
  isGenerating: boolean;
}

export function CopilotMessageList({ messages, isGenerating }: CopilotMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                isUser
                  ? 'bg-amber-500 text-slate-950 font-mono shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-amber-400 border border-slate-700'
              }`}
            >
              {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-[11px] ${
                isUser
                  ? 'bg-amber-500/15 border border-amber-500/30 text-slate-100 font-medium whitespace-pre-wrap'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              {!isUser && msg.agente && (
                <div>
                  <CopilotAgentBadge agente={msg.agente} />
                </div>
              )}
              {isUser ? msg.content : <CopilotMarkdownRenderer content={msg.content} />}
              {!isUser && msg.trazas && msg.trazas.length > 0 && (
                <CopilotTracePanel trazas={msg.trazas} />
              )}
            </div>
          </div>
        );
      })}

      {isGenerating && (
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center shrink-0">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 text-slate-400 text-[11px]">
            <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
            <span className="font-mono">Coordinando especialistas ReAct...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default CopilotMessageList;
