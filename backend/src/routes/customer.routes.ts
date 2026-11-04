import { Router } from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
} from "../schemas/customer.schema";

const router = Router();

router.use(authMiddleware);
router.get("/", getCustomers);
router.get("/:id", validate(customerIdParamSchema), getCustomerById);
router.post("/", validate(createCustomerSchema), createCustomer);
router.put("/:id", validate(updateCustomerSchema), updateCustomer);
router.delete("/:id", validate(customerIdParamSchema), deleteCustomer);

export default router;
