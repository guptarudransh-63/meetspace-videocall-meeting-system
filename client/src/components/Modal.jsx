import { useEffect } from "react";
import { X } from "lucide-react";
const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg"
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 overflow-y-auto">
      {
    /* Backdrop */
  }
      <div
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    onClick={onClose}
  />

      {
    /* Modal Dialog */
  }
      <div className="flex min-h-full items-center justify-center p-4">
        <div
    className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-10 transition-all transform scale-100 animate-in fade-in zoom-in-95 duration-150`}
  >
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
            <button
    onClick={onClose}
    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
  >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>;
};
export {
  Modal
};
