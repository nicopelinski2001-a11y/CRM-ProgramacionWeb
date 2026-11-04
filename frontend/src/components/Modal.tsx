import { ReactNode, useEffect, useId, useRef } from "react";
import { Icon } from "./Icon";

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
  className?: string;
}

// El diálogo nativo maneja el foco, la tecla Escape y el bloqueo del fondo.
export function Modal({
  title,
  description,
  onClose,
  children,
  busy = false,
  className = "",
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current!;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={headingId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="modal-surface">
        <div className="modal-heading">
          <div>
            <h2 id={headingId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar ventana"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
