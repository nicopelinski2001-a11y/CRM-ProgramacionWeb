import { useState } from "react";
import { CUSTOMER_STATUSES, Customer, CustomerStatus } from "../types";
import { getErrorMessage } from "../api/errors";
import { getAvatarColor, getInitials } from "./CustomerRow";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

interface CustomerDetailProps {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: CustomerStatus) => Promise<void>;
}

export function CustomerDetail({
  customer,
  onClose,
  onEdit,
  onStatusChange,
}: CustomerDetailProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function changeStatus(status: CustomerStatus) {
    setBusy(true);
    setError("");
    try {
      await onStatusChange(status);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Ficha de contacto"
      description="Los detalles que hacen la diferencia."
      onClose={onClose}
      busy={busy}
    >
      <div className="contact-detail">
        <div className="detail-profile">
          <span
            className={`avatar avatar-large avatar-${getAvatarColor(customer.name)}`}
          >
            {getInitials(customer.name)}
          </span>
          <h3>{customer.name}</h3>
          <p>{customer.company || "Contacto independiente"}</p>
        </div>
        <div className="detail-data">
          <div>
            <Icon name="mail" size={18} />
            <span>
              <small>Correo electrónico</small>
              <a href={`mailto:${customer.email}`}>{customer.email}</a>
            </span>
          </div>
          <div>
            <Icon name="phone" size={18} />
            <span>
              <small>Teléfono</small>
              {customer.phone ? (
                <a href={`tel:${customer.phone.replace(/[^+\d]/g, "")}`}>
                  {customer.phone}
                </a>
              ) : (
                <span>Sin teléfono registrado</span>
              )}
            </span>
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="detail-status">Estado de la relación</label>
          <select
            id="detail-status"
            value={customer.status}
            disabled={busy}
            onChange={(e) => changeStatus(e.target.value as CustomerStatus)}
          >
            {Object.entries(CUSTOMER_STATUSES).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
          {busy && <p className="field-hint">Guardando estado…</p>}
        </div>
        <div className="detail-notes">
          <h4>
            <Icon name="note" size={17} />
            Notas del contacto
          </h4>
          <p>
            {customer.notes ||
              "Todavía no hay notas. Editá el contacto para registrar una conversación o tu próximo paso."}
          </p>
        </div>
        <p className="detail-timestamp">
          Última actualización:{" "}
          {new Date(customer.updatedAt).toLocaleString("es-AR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button
          className="button button-secondary"
          onClick={onClose}
          disabled={busy}
        >
          Cerrar
        </button>
        <button
          className="button button-primary"
          onClick={onEdit}
          disabled={busy}
        >
          <Icon name="edit" size={16} />
          Editar contacto
        </button>
      </div>
    </Modal>
  );
}
