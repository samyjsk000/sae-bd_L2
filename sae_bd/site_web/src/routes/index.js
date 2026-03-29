import { Router } from "express";
import paysRoutes from "./pays.routes.js";
import cuisineRoutes from "./cuisine.routes.js";
import ingredientRoutes from "./ingredients.routes.js";
import platsRoutes from "./plats.routes.js";
import recettesRoutes from "./recettes.routes.js";
import menusRoutes from "./menus.routes.js";
import utensilsRoutes from "./utensils.routes.js";
import fournisseursRoutes from "./fournisseurs.routes.js";
import restrictionsRoutes from "./restrictions.routes.js";
import categoriesRoutes from "./categories.routes.js";

const router = Router();

router.use("/pays", paysRoutes);
router.use("/cuisines", cuisineRoutes);
router.use("/ingredients", ingredientRoutes);
router.use("/plats", platsRoutes);
router.use("/recettes", recettesRoutes);
router.use("/menus", menusRoutes);
router.use("/utensils", utensilsRoutes);
router.use("/fournisseurs", fournisseursRoutes);
router.use("/restrictions", restrictionsRoutes);
router.use("/categories", categoriesRoutes);

export default router;
