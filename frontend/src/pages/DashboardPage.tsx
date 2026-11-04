import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  CUSTOMER_STATUSES,
  Customer,
  CustomerInput,
  CustomerStatus,
} from "../types";
import {
  createCustomerRequest,
  deleteCustomerRequest,
  getCustomersRequest,
  updateCustomerRequest,
} from "../api/customers.api";
import { getErrorMessage } from "../api/errors";
import { CustomerForm } from "../components/CustomerForm";
import { CustomerDetail } from "../components/CustomerDetail";
import { CustomerRow, getInitials } from "../components/CustomerRow";
import { Icon, IconName } from "../components/Icon";
import { Modal } from "../components/Modal";

type Filter = "ALL" | CustomerStatus;
type Dialog =
  { type: "create" } | { type: "edit" | "view" | "delete"; id: string } | null;

const filters: { value: Filter; label: string; icon: IconName }[] = [
  { value: "ALL", label: "Todos los contactos", icon: "users" },
  { value: "PROSPECT", label: "Prospectos", icon: "user-plus" },
  { value: "FOLLOW_UP", label: "En seguimiento", icon: "clock" },
  { value: "CLIENT", label: "Clientes", icon: "check" },
];

// La búsqueda y los filtros son locales: la API entrega solo los contactos del usuario.
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR");
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadCustomers(controller.signal);
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadCustomers(signal?: AbortSignal) {
    setIsLoading(true);
    setError("");
    try {
      const data = await getCustomersRequest(signal);
      if (!signal?.aborted) setCustomers(data);
    } catch (error) {
      if (!signal?.aborted)
        setError(
          getErrorMessage(error, "No se pudieron cargar los contactos."),
        );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }

  async function saveCustomer(data: CustomerInput) {
    if (dialog?.type === "edit") {
      const updated = await updateCustomerRequest(dialog.id, data);
      setCustomers((previous) =>
        previous.map((customer) =>
          customer.id === updated.id ? updated : customer,
        ),
      );
      setToast("Contacto actualizado. Todo al día.");
    } else {
      const created = await createCustomerRequest(data);
      setCustomers((previous) => [created, ...previous]);
      setFilter("ALL");
      setSearch("");
      setSort("newest");
      setToast("Nuevo contacto agregado a tu órbita.");
    }
  }

  async function changeStatus(id: string, status: CustomerStatus) {
    const updated = await updateCustomerRequest(id, { status });
    setCustomers((previous) =>
      previous.map((customer) => (customer.id === id ? updated : customer)),
    );
    setToast(`Estado actualizado: ${CUSTOMER_STATUSES[status].toLowerCase()}.`);
  }

  async function removeCustomer() {
    if (!dialog || dialog.type !== "delete") return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteCustomerRequest(dialog.id);
      setCustomers((previous) =>
        previous.filter((customer) => customer.id !== dialog.id),
      );
      setDialog(null);
      setToast("Contacto eliminado.");
    } catch (error) {
      setDeleteError(
        getErrorMessage(error, "No se pudo eliminar el contacto."),
      );
    } finally {
      setDeleting(false);
    }
  }

  const counts = {
    ALL: customers.length,
    PROSPECT: customers.filter((customer) => customer.status === "PROSPECT")
      .length,
    FOLLOW_UP: customers.filter((customer) => customer.status === "FOLLOW_UP")
      .length,
    CLIENT: customers.filter((customer) => customer.status === "CLIENT").length,
  };
  const visibleCustomers = customers
    .filter((customer) => {
      const matchesStatus = filter === "ALL" || customer.status === filter;
      const matchesSearch = normalize(
        [customer.name, customer.company, customer.email, customer.phone].join(
          " ",
        ),
      ).includes(normalize(search.trim()));
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "es")
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const selectedCustomer =
    dialog && "id" in dialog
      ? customers.find((customer) => customer.id === dialog.id)
      : undefined;
  const clientPercentage = customers.length
    ? Math.round((counts.CLIENT / customers.length) * 100)
    : 0;
  const activeFilterLabel = filters.find(
    (entry) => entry.value === filter,
  )!.label;
  const firstName = user?.name.trim().split(/\s+/)[0] || "de nuevo";
  const today = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  function chooseFilter(value: Filter) {
    setFilter(value);
  }
  function closeDialog() {
    setDialog(null);
    setDeleteError("");
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <aside className="sidebar" aria-label="Navegación principal">
        <a href="/dashboard" className="brand" aria-label="Órbita CRM, inicio">
          <span className="brand-symbol">
            <Icon name="orbit" size={28} />
          </span>
          <span>
            órbita<span className="brand-tag">CRM</span>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-symbol">
            <Icon name="building" size={17} />
          </span>
          <div>
            <strong>Mi espacio de trabajo</strong>
            <span>Tu negocio, más cerca</span>
          </div>
        </div>
        <p className="nav-label">TU ESPACIO</p>
        <nav className="sidebar-nav">
          {filters.map(({ value, label, icon }) => (
            <button
              key={value}
              className={`nav-item ${filter === value ? "active" : ""}`}
              onClick={() => chooseFilter(value)}
              aria-current={filter === value ? "page" : undefined}
            >
              <Icon name={icon} size={19} />
              <span>{label}</span>
              <span className="nav-count">
                {isLoading || error ? "–" : counts[value]}
              </span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon">
              <Icon name="sparkles" size={20} />
            </span>
            <strong>Las relaciones se cuidan.</strong>
            <p>Una conversación a tiempo puede ser tu próxima oportunidad.</p>
            <button
              onClick={() => {
                setFilter("FOLLOW_UP");
                searchRef.current?.focus();
              }}
            >
              Ver seguimientos <Icon name="arrow-right" size={15} />
            </button>
          </div>
          <div className="sidebar-user">
            <span className="avatar avatar-violet">
              {getInitials(user?.name || "Usuario")}
            </span>
            <div>
              <strong>{user?.name}</strong>
              <span>Cuenta personal</span>
            </div>
            <button
              className="icon-button"
              onClick={logout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <Icon name="logout" size={19} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <Icon name="grid" size={17} />
            <span>Mi espacio</span>
            <Icon name="chevron-right" size={13} />
            <strong>Contactos</strong>
          </div>
          <div className="topbar-right">
            <span className="private-label">
              <Icon name="shield" size={14} />
              Espacio privado
            </span>
            <span className="topbar-divider" />
            <span
              className="avatar avatar-small avatar-violet"
              title={user?.name}
            >
              {getInitials(user?.name || "Usuario")}
            </span>
          </div>
        </header>
        <main className="dashboard" id="main-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                <span />
                TU NEGOCIO EN ÓRBITA
              </p>
              <h1>
                Hola, {firstName}
                <span className="greeting-dot">.</span>
              </h1>
              <p>Cada contacto es el comienzo de algo bueno.</p>
            </div>
            <span className="today-label">
              <Icon name="calendar" size={17} />
              {today}
            </span>
          </div>

          <section
            className="welcome-banner"
            aria-label="Resumen de tus relaciones comerciales"
          >
            <div className="welcome-copy">
              <span className="banner-label">
                MENOS PLANILLAS. MÁS CONEXIONES.
              </span>
              <h2>
                Grandes relaciones.
                <br />
                <span>Nuevas oportunidades.</span>
              </h2>
              <p>
                Conocé a tus contactos, acompañá cada conversación
                <br className="desktop-break" /> y convertí el seguimiento en
                confianza.
              </p>
              <button
                className="banner-link"
                disabled={isLoading}
                onClick={() => setDialog({ type: "create" })}
              >
                Hacé tu próxima conexión{" "}
                <Icon name="arrow-up-right" size={18} />
              </button>
            </div>
            <div className="orbit-visual" aria-hidden="true">
              <div className="orbit-ring orbit-ring-outer" />
              <div className="orbit-ring orbit-ring-inner" />
              <span className="orbit-core">
                <Icon name="orbit" size={49} />
              </span>
              <span className="orbit-person orbit-person-one">
                <Icon name="user" size={24} />
              </span>
              <span className="orbit-person orbit-person-two">
                <Icon name="building" size={23} />
              </span>
              <span className="orbit-person orbit-person-three">
                <Icon name="users" size={23} />
              </span>
              <span className="orbit-floating-label">
                <span className="floating-check">
                  <Icon name="check" size={13} />
                </span>
                Conexiones que suman
              </span>
              <span className="orbit-star star-one">✦</span>
              <span className="orbit-star star-two">✦</span>
              <span className="orbit-dot dot-one" />
              <span className="orbit-dot dot-two" />
            </div>
          </section>

          <section className="stats-grid" aria-label="Resumen de contactos">
            {filters.map(({ value, icon }, index) => (
              <button
                key={value}
                className={`stat-card stat-${index}`}
                onClick={() => chooseFilter(value)}
                aria-label={`Filtrar ${value === "ALL" ? "todos los contactos" : filters[index].label.toLowerCase()}`}
              >
                <div className="stat-top">
                  <span>
                    {
                      [
                        "Total de contactos",
                        "Prospectos",
                        "En seguimiento",
                        "Clientes",
                      ][index]
                    }
                  </span>
                  <span className="stat-icon">
                    <Icon name={icon} size={19} />
                  </span>
                </div>
                <div className="stat-bottom">
                  <strong>
                    {isLoading || error
                      ? "—"
                      : counts[value].toString().padStart(2, "0")}
                  </strong>
                  <span>
                    {
                      [
                        "Tu red de conexiones",
                        "Relaciones por descubrir",
                        "Conversaciones abiertas",
                        "Confianza construida",
                      ][index]
                    }
                  </span>
                </div>
              </button>
            ))}
          </section>

          <section className="contacts-panel" aria-labelledby="contacts-title">
            <div className="panel-heading">
              <div>
                <h2 id="contacts-title">
                  Tu red de contactos{" "}
                  <span>{isLoading || error ? "–" : customers.length}</span>
                </h2>
                <p>Personas, conversaciones y próximos pasos.</p>
              </div>
              <button
                className="button button-primary"
                disabled={isLoading}
                onClick={() => setDialog({ type: "create" })}
              >
                <Icon name="plus" size={18} />
                Nuevo contacto
              </button>
            </div>
            <div className="panel-toolbar">
              <div
                className="filter-tabs"
                role="group"
                aria-label="Filtrar contactos por estado"
              >
                {filters.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => chooseFilter(value)}
                    className={filter === value ? "selected" : ""}
                    aria-pressed={filter === value}
                  >
                    {value === "ALL" ? "Todos" : label}
                    <span>{isLoading || error ? "–" : counts[value]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="search-toolbar">
              <div className="search-field">
                <Icon name="search" size={18} />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Buscar por nombre, empresa o email…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Buscar contactos"
                />
              </div>
              <label className="sort-field">
                <span>Ordenar por:</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  aria-label="Ordenar contactos"
                >
                  <option value="newest">Más recientes</option>
                  <option value="name">Nombre A–Z</option>
                </select>
              </label>
            </div>

            {isLoading ? (
              <div className="panel-state" role="status">
                <span className="spinner spinner-accent" />
                <h3>Preparando tu espacio…</h3>
                <p>Estamos cargando tus contactos.</p>
              </div>
            ) : error ? (
              <div className="panel-state">
                <span className="state-icon state-error">
                  <Icon name="alert" size={25} />
                </span>
                <h3>No pudimos cargar tu red</h3>
                <p role="alert">{error}</p>
                <button
                  className="button button-secondary"
                  onClick={() => loadCustomers()}
                >
                  Volver a intentar
                </button>
              </div>
            ) : visibleCustomers.length ? (
              <div className="table-scroll">
                <table className="contacts-table">
                  <caption className="sr-only">
                    {activeFilterLabel}: {visibleCustomers.length} contactos
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">CONTACTO</th>
                      <th scope="col">EMAIL Y TELÉFONO</th>
                      <th scope="col">ESTADO</th>
                      <th scope="col">FECHA DE ALTA</th>
                      <th scope="col">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCustomers.map((customer) => (
                      <CustomerRow
                        key={customer.id}
                        customer={customer}
                        onView={() =>
                          setDialog({ type: "view", id: customer.id })
                        }
                        onEdit={() =>
                          setDialog({ type: "edit", id: customer.id })
                        }
                        onDelete={() => {
                          setDeleteError("");
                          setDialog({ type: "delete", id: customer.id });
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel-state">
                <span className="state-icon">
                  <Icon name={search ? "search" : "users"} size={29} />
                </span>
                <h3>
                  {search
                    ? "No encontramos coincidencias"
                    : customers.length
                      ? "Todavía no hay contactos en este estado"
                      : "Tu próxima conexión empieza acá"}
                </h3>
                <p>
                  {search
                    ? "Probá con otro nombre, empresa, email o teléfono."
                    : customers.length
                      ? "Podés cambiar el estado desde la ficha de cada contacto."
                      : "Agregá tu primer contacto y empezá a construir tu red."}
                </p>
                {search || customers.length ? (
                  <button
                    className="button button-secondary"
                    onClick={() => {
                      setSearch("");
                      setFilter("ALL");
                    }}
                  >
                    Ver todos los contactos
                  </button>
                ) : (
                  <button
                    className="button button-primary"
                    disabled={isLoading}
                    onClick={() => setDialog({ type: "create" })}
                  >
                    <Icon name="plus" size={17} />
                    Crear primer contacto
                  </button>
                )}
              </div>
            )}

            {!isLoading && !error && (
              <div className="table-footer">
                <p>
                  Mostrando <strong>{visibleCustomers.length}</strong> de{" "}
                  <strong>{customers.length}</strong> contactos
                </p>
                <span>
                  <span className="saved-dot" />
                  Tus relaciones, en un solo lugar
                </span>
              </div>
            )}
          </section>

          <div className="dashboard-footer">
            <span>Hecho para conectar. Diseñado para crecer.</span>
            <span>
              órbita <span className="footer-brand-tag">CRM</span>
              <span className="footer-dot">·</span>
              {!isLoading && !error
                ? `${clientPercentage}% de tu red son clientes`
                : "Tu espacio de relaciones"}
            </span>
          </div>
        </main>
      </div>

      {dialog?.type === "create" && (
        <CustomerForm onSubmit={saveCustomer} onClose={closeDialog} />
      )}
      {dialog?.type === "edit" && selectedCustomer && (
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={saveCustomer}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === "view" && selectedCustomer && (
        <CustomerDetail
          customer={selectedCustomer}
          onClose={closeDialog}
          onEdit={() => setDialog({ type: "edit", id: selectedCustomer.id })}
          onStatusChange={(status) => changeStatus(selectedCustomer.id, status)}
        />
      )}
      {dialog?.type === "delete" && selectedCustomer && (
        <Modal
          className="modal-small"
          title="¿Eliminar este contacto?"
          description="Esta acción elimina la ficha y sus notas de tu espacio."
          onClose={closeDialog}
          busy={deleting}
        >
          <div className="delete-content">
            <span className="delete-icon">
              <Icon name="trash" size={25} />
            </span>
            <p>
              Vas a eliminar a <strong>{selectedCustomer.name}</strong>. Si
              querés volver a contactar a esta persona, tendrás que agregarla
              otra vez.
            </p>
            {deleteError && (
              <p className="error-message" role="alert">
                {deleteError}
              </p>
            )}
          </div>
          <div className="modal-footer">
            <button
              className="button button-secondary"
              onClick={closeDialog}
              disabled={deleting}
            >
              Cancelar
            </button>
            <button
              className="button button-danger"
              onClick={removeCustomer}
              disabled={deleting}
            >
              {deleting ? "Eliminando…" : "Eliminar contacto"}
            </button>
          </div>
        </Modal>
      )}
      <div
        className="toast-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast && (
          <div className="toast">
            <span className="toast-icon">
              <Icon name="check" size={17} />
            </span>
            {toast}
            <button
              className="icon-button"
              onClick={() => setToast("")}
              aria-label="Cerrar notificación"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
