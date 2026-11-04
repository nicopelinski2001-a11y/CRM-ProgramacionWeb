import { Router } from "express";
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/item.controller";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createItemSchema,
  updateItemSchema,
  itemIdParamSchema,
} from "../schemas/item.schema";

const router = Router();

// Todas las rutas de items requieren estar autenticado.
router.use(authMiddleware);

router.get("/", getItems);
router.get("/:id", validate(itemIdParamSchema), getItemById);
router.post("/", validate(createItemSchema), createItem);
router.put("/:id", validate(updateItemSchema), updateItem);
router.delete("/:id", validate(itemIdParamSchema), deleteItem);

export default router;
