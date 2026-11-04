import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerForm } from "../src/components/CustomerForm";
import { Customer } from "../src/types";

const customer: Customer = {
  id: "contact-1",
  userId: "user-1",
  name: "Lucía Demo",
  email: "lucia@example.com",
  company: "Estudio Sur",
  phone: null,
  notes: "Enviar propuesta",
  status: "FOLLOW_UP",
  createdAt: "2026-11-04T12:00:00.000Z",
  updatedAt: "2026-11-04T12:00:00.000Z",
};

async function fillRequired(name = "Lucía Demo") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Nombre completo/), name);
  await user.type(
    screen.getByLabelText(/Correo electrónico/),
    "lucia@example.com",
  );
  return user;
}

describe("Formulario de contactos", () => {
  test("rechaza un nombre compuesto únicamente por espacios", async () => {
    const onSubmit = jest.fn();
    render(<CustomerForm onSubmit={onSubmit} onClose={jest.fn()} />);
    const user = await fillRequired("   ");
    await user.click(screen.getByRole("button", { name: "Crear contacto" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ingresá el nombre del contacto.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("envía datos limpios y cierra después de guardarlos", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<CustomerForm onSubmit={onSubmit} onClose={onClose} />);
    const user = await fillRequired("  Lucía Demo  ");
    await user.type(screen.getByLabelText(/^Empresa/), "  Estudio Sur  ");
    await user.click(screen.getByRole("button", { name: "Crear contacto" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Lucía Demo",
      email: "lucia@example.com",
      company: "Estudio Sur",
      phone: "",
      notes: "",
      status: "PROSPECT",
    });
  });

  test("permite elegir el estado comercial al crear", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<CustomerForm onSubmit={onSubmit} onClose={jest.fn()} />);
    const user = await fillRequired();
    await user.selectOptions(
      screen.getByLabelText("Estado de la relación"),
      "CLIENT",
    );
    await user.click(screen.getByRole("button", { name: "Crear contacto" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ status: "CLIENT" }),
      ),
    );
  });

  test("un error del servidor conserva los datos y permite reintentar", async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValueOnce(new Error("No se pudo guardar el contacto."))
      .mockResolvedValueOnce(undefined);
    const onClose = jest.fn();
    render(<CustomerForm onSubmit={onSubmit} onClose={onClose} />);
    const user = await fillRequired();
    await user.click(screen.getByRole("button", { name: "Crear contacto" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo guardar el contacto.",
    );
    expect(screen.getByLabelText(/Nombre completo/)).toHaveValue("Lucía Demo");
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Crear contacto" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  test("bloquea otro envío y el cierre mientras está guardando", async () => {
    let finish!: () => void;
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const onClose = jest.fn();
    render(<CustomerForm onSubmit={onSubmit} onClose={onClose} />);
    const user = await fillRequired();
    await user.click(screen.getByRole("button", { name: "Crear contacto" }));
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByLabelText(/Nombre completo/)).toBeDisabled();
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => finish());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("edita un contacto existente y permite vaciar sus notas", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <CustomerForm
        customer={customer}
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />,
    );
    const user = userEvent.setup();
    expect(screen.getByLabelText(/Nombre completo/)).toHaveValue("Lucía Demo");
    expect(screen.getByLabelText("Estado de la relación")).toHaveValue(
      "FOLLOW_UP",
    );
    await user.clear(screen.getByLabelText(/^Notas/));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ notes: "", status: "FOLLOW_UP" }),
      ),
    );
  });

  test("cancelar cierra sin guardar", async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    render(<CustomerForm onSubmit={onSubmit} onClose={onClose} />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
