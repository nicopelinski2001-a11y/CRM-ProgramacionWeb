import { CUSTOMER_STATUSES, Customer } from "../types";
import { Icon } from "./Icon";

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getAvatarColor(name: string): string {
  return ["violet", "peach", "blue", "mint", "pink"][
    Array.from(name).reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    ) % 5
  ];
}

export function StatusBadge({ status }: { status: Customer["status"] }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span />
      {CUSTOMER_STATUSES[status]}
    </span>
  );
}

interface CustomerRowProps {
  customer: Customer;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CustomerRow({
  customer,
  onView,
  onEdit,
  onDelete,
}: CustomerRowProps) {
  return (
    <tr>
      <td>
        <button
          className="contact-identity"
          onClick={onView}
          aria-label={`Ver contacto ${customer.name}`}
        >
          <span className={`avatar avatar-${getAvatarColor(customer.name)}`}>
            {getInitials(customer.name)}
          </span>
          <span>
            <strong>{customer.name}</strong>
            <small>{customer.company || "Contacto independiente"}</small>
          </span>
        </button>
      </td>
      <td className="contact-email">
        <a href={`mailto:${customer.email}`}>{customer.email}</a>
        <span>{customer.phone || "Sin teléfono"}</span>
      </td>
      <td className="contact-status">
        <StatusBadge status={customer.status} />
      </td>
      <td className="contact-date">
        {new Intl.DateTimeFormat("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(customer.createdAt))}
      </td>
      <td className="contact-actions">
        <div className="row-actions">
          <button
            className="icon-button"
            aria-label={`Editar a ${customer.name}`}
            title="Editar contacto"
            onClick={onEdit}
          >
            <Icon name="edit" size={17} />
          </button>
          <button
            className="icon-button danger-hover"
            aria-label={`Eliminar a ${customer.name}`}
            title="Eliminar contacto"
            onClick={onDelete}
          >
            <Icon name="trash" size={17} />
          </button>
        </div>
      </td>
    </tr>
  );
}
