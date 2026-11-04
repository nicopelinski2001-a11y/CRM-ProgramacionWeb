import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("El seed con credenciales de demostración solo está habilitado en desarrollo o tests.");
  }
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      password: hashedPassword,
      name: "Usuario de Prueba",
    },
  });

  const existingCustomers = await prisma.customer.count({ where: { userId: user.id } });
  if (existingCustomers === 0) {
    await prisma.customer.createMany({
      data: [
        {
          name: "Sofía Martínez", company: "Estudio Norte", email: "sofia@estudionorte.example",
          phone: "+54 351 555 0101", status: "CLIENT", userId: user.id,
          notes: "Cliente desde marzo. Coordinar la próxima reunión de seguimiento.",
        },
        {
          name: "Martín López", company: "Forma Digital", email: "martin@formadigital.example",
          phone: "+54 351 555 0102", status: "FOLLOW_UP", userId: user.id,
          notes: "Se envió la propuesta comercial. Consultar si necesita información adicional.",
        },
        {
          name: "Valentina Torres", company: "Casa Botánica", email: "valentina@casabotanica.example",
          phone: "+54 351 555 0103", status: "PROSPECT", userId: user.id,
          notes: "Primer contacto a través del formulario web. Presentar nuestros servicios.",
        },
        {
          name: "Lucas Fernández", company: "Punto Sur", email: "lucas@puntosur.example",
          phone: "+54 351 555 0104", status: "CLIENT", userId: user.id,
          notes: "Confirmó la propuesta. Mantener actualizado el contacto de administración.",
        },
        {
          name: "Camila Romero", company: "Lumen Arquitectura", email: "camila@lumen.example",
          phone: "+54 351 555 0105", status: "FOLLOW_UP", userId: user.id,
          notes: "Interesada en una reunión para conocer las opciones disponibles.",
        },
        {
          name: "Tomás Herrera", company: "Andén Café", email: "tomas@andencafe.example",
          phone: "+54 351 555 0106", status: "PROSPECT", userId: user.id,
          notes: "Nuevo emprendimiento. Consultar qué necesita antes de preparar una propuesta.",
        },
      ],
    });
    console.log("Contactos de ejemplo creados: 6 (2 prospectos, 2 en seguimiento, 2 clientes).");
  } else {
    console.log("El usuario de prueba ya tiene contactos. Se conservan sus datos.");
  }

  const existingItems = await prisma.item.count({ where: { userId: user.id } });
  if (existingItems > 0) {
    console.log("El usuario de prueba ya tiene tareas. Se conservan sus datos.");
    return;
  }

  await prisma.item.createMany({
    data: [
      {
        title: "Preparar la presentación del proyecto",
        description: "Organizar una demo del login y de las cuatro operaciones del CRUD.",
        completed: false,
        userId: user.id,
      },
      {
        title: "Diseñar la pantalla de inicio de sesión",
        description: "Agregar validaciones, mensajes de error y acceso al registro.",
        completed: true,
        userId: user.id,
      },
      {
        title: "Revisar los endpoints de tareas",
        description: "Probar crear, consultar, editar y eliminar una tarea con el usuario autenticado.",
        completed: false,
        userId: user.id,
      },
      {
        title: "Conectar la base de datos",
        description: "Crear las tablas de usuarios y tareas con las migraciones de Prisma.",
        completed: true,
        userId: user.id,
      },
      {
        title: "Ensayar la exposición del segundo parcial",
        description: "Explicar el recorrido desde el formulario de React hasta PostgreSQL.",
        completed: false,
        userId: user.id,
      },
    ],
  });

  console.log("Seed completado:");
  console.log("  Usuario:", user.email, "/ password123");
  console.log("  Tareas creadas: 5");
}

main()
  .catch((e) => {
    console.error("Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
