import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: ReactNode;
}

const MAX_WIDTH_MAP: Record<NonNullable<ModalContainerProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function ModalContainer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'md',
  children,
}: ModalContainerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = MAX_WIDTH_MAP[maxWidth] || 'max-w-md';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 w-full ${widthClass} relative shadow-2xl selection:bg-amber-500 selection:text-slate-950 my-auto`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana modal"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {(title || icon) && (
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3 mb-4 pr-8">
            {icon && (
              <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  {title}
                </h4>
              )}
              {subtitle && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default ModalContainer;
