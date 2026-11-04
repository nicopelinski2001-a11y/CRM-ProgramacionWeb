import { FormEvent, useState } from "react";
import { CUSTOMER_STATUSES, Customer, CustomerInput } from "../types";
import { getErrorMessage } from "../api/errors";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerInput) => Promise<void>;
  onClose: () => void;
}

export function CustomerForm({
  customer,
  onSubmit,
  onClose,
}: CustomerFormProps) {
  const [values, setValues] = useState<CustomerInput>({
    name: customer?.name ?? "",
    company: customer?.company ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    notes: customer?.notes ?? "",
    status: customer?.status ?? "PROSPECT",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function change(field: keyof CustomerInput, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Ingresá el nombre del contacto.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        company: values.company.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        notes: values.notes.trim(),
      });
      onClose();
    } catch (error) {
      setError(getErrorMessage(error, "No se pudo guardar el contacto."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={customer ? "Editar contacto" : "Un nuevo vínculo empieza acá"}
      description={
        customer
          ? "Actualizá sus datos para tener todo al día."
          : "Agregá los datos de la persona que querés conocer mejor."
      }
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={handleSubmit} className="customer-form">
        <fieldset disabled={busy}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="customer-name">
                Nombre completo <span>*</span>
              </label>
              <input
                id="customer-name"
                autoFocus
                autoComplete="name"
                required
                maxLength={100}
                placeholder="Ej. Lucía Fernández"
                value={values.name}
                onChange={(e) => change("name", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="customer-company">
                Empresa <small>Opcional</small>
              </label>
              <input
                id="customer-company"
                autoComplete="organization"
                maxLength={100}
                placeholder="Ej. Estudio Norte"
                value={values.company}
                onChange={(e) => change("company", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="customer-email">
                Correo electrónico <span>*</span>
              </label>
              <input
                id="customer-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="lucia@empresa.com"
                value={values.email}
                onChange={(e) => change("email", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="customer-phone">
                Teléfono <small>Opcional</small>
              </label>
              <input
                id="customer-phone"
                type="tel"
                autoComplete="tel"
                maxLength={30}
                placeholder="Ej. +54 351 555 0123"
                value={values.phone}
                onChange={(e) => change("phone", e.target.value)}
              />
            </div>
            <div className="form-field form-full">
              <label htmlFor="customer-status">Estado de la relación</label>
              <select
                id="customer-status"
                value={values.status}
                onChange={(e) => change("status", e.target.value)}
              >
                {Object.entries(CUSTOMER_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="field-hint">
                Prospecto → En seguimiento → Cliente. Vos decidís el próximo
                paso.
              </p>
            </div>
            <div className="form-field form-full">
              <label htmlFor="customer-notes">
                Notas <small>Opcional</small>
              </label>
              <textarea
                id="customer-notes"
                rows={3}
                maxLength={2000}
                placeholder="¿Qué conversaron? ¿Cuál es el próximo paso?"
                value={values.notes}
                onChange={(e) => change("notes", e.target.value)}
              />
              <span className="character-count">
                {values.notes.length}/2000
              </span>
            </div>
          </div>
        </fieldset>
        {error && (
          <div className="error-message" role="alert">
            <Icon name="alert" size={18} />
            {error}
          </div>
        )}
        <div className="modal-footer">
          <span className="required-note">* Campos obligatorios</span>
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={busy}
          >
            {busy ? (
              <span className="spinner" />
            ) : (
              <Icon name={customer ? "check" : "plus"} size={17} />
            )}
            {busy
              ? "Guardando…"
              : customer
                ? "Guardar cambios"
                : "Crear contacto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
