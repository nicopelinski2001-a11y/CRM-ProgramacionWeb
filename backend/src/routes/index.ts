import { Router } from "express";
import authRoutes from "./auth.routes";
import itemRoutes from "./item.routes";
import customerRoutes from "./customer.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/items", itemRoutes);
router.use("/customers", customerRoutes);

export default router;
