import { Bot, X, Trash2, Send, AlertCircle, Sparkles } from 'lucide-react';
import type { AgentRole, CopilotChatMessage } from '../agents/types';
import { CopilotMessageList } from './CopilotMessageList';
import { CopilotQuickPrompts } from './CopilotQuickPrompts';

interface AdminCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: CopilotChatMessage[];
  input: string;
  setInput: (value: string) => void;
  isGenerating: boolean;
  error: string | null;
  remainingQuota?: number;
  maxQuota?: number;
  showQuota?: boolean;
  onSendMessage: (prompt?: string, agente?: AgentRole) => void;
  onClearChat: () => void;
}

export function AdminCopilotModal({
  isOpen,
  onClose,
  messages,
  input,
  setInput,
  isGenerating,
  error,
  remainingQuota,
  maxQuota,
  showQuota = false,
  onSendMessage,
  onClearChat,
}: AdminCopilotModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg h-[90vh] sm:h-[620px] bg-slate-950 border border-slate-800 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        
        <div className="px-5 py-3.5 border-b border-slate-900 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-white tracking-tight">SIS-COPILOT</h3>
                <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" /> ReAct
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Sistema Multi-Agente ReAct · ML Pasco</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showQuota && typeof remainingQuota === 'number' && typeof maxQuota === 'number' && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                {remainingQuota}/{maxQuota} hoy
              </span>
            )}

            <button
              type="button"
              onClick={onClearChat}
              title="Limpiar conversación"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Cerrar copiloto"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-[11px] flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <CopilotMessageList messages={messages} isGenerating={isGenerating} />

        <CopilotQuickPrompts onSelectPrompt={onSendMessage} disabled={isGenerating} />

        <form onSubmit={handleSubmit} className="p-3 bg-slate-900/60 border-t border-slate-900 flex gap-2">
          <input
            id="copilot-prompt"
            aria-label="Pregunta para el copiloto"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
            placeholder="Pregunta sobre flota, viajes o consumo de diésel..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none text-white text-xs placeholder:text-slate-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Enviar mensaje al copiloto"
            disabled={isGenerating || !input.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold transition-colors cursor-pointer flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
}

export default AdminCopilotModal;
