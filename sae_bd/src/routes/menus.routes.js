import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { menus, menusPlats, plats, recettes } from "../db/schema.js";
import { asyncHandler, parseId, parsePagination } from "../utils/http.js";

const router = Router();

const buildPayload = (body) => ({
  nomMenu: body.nomMenu,
  imageMenu: body.imageMenu,
  description: body.description,
  creeA: body.creeA ? new Date(body.creeA) : new Date(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const rows = await db.select().from(menus).limit(limit).offset(offset);
    res.json({ data: rows, pagination: { limit, offset } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid menu id" });
    }

    const [row] = await db.select().from(menus).where(eq(menus.idMenu, id));
    if (!row) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res.json({ data: row });
  }),
);

router.get(
  "/:id/plats",
  asyncHandler(async (req, res) => {
    const idMenu = parseId(req.params.id);
    if (!idMenu) {
      return res.status(400).json({ message: "Invalid menu id" });
    }

    const rows = await db
      .select({
        idPlat: plats.idPlat,
        nomPlat: plats.nomPlat,
        imagePlat: plats.imagePlat,
        description: plats.description,
        idCuisine: plats.idCuisine,
      })
      .from(menusPlats)
      .innerJoin(plats, eq(menusPlats.idPlat, plats.idPlat))
      .where(eq(menusPlats.idMenu, idMenu));

    res.json({ data: rows });
  }),
);

router.get(
  "/:id/recettes",
  asyncHandler(async (req, res) => {
    const idMenu = parseId(req.params.id);
    if (!idMenu) {
      return res.status(400).json({ message: "Invalid menu id" });
    }

    const rows = await db
      .select({
        idRecette: recettes.idRecette,
        nomRecette: recettes.nomRecette,
        tempsPrep: recettes.tempsPrep,
        idPlat: recettes.idPlat,
        nomPlat: plats.nomPlat,
      })
      .from(menusPlats)
      .innerJoin(plats, eq(menusPlats.idPlat, plats.idPlat))
      .innerJoin(recettes, eq(recettes.idPlat, plats.idPlat))
      .where(eq(menusPlats.idMenu, idMenu));

    res.json({ data: rows });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = buildPayload(req.body);
    if (!payload.nomMenu) {
      return res.status(400).json({ message: "nomMenu is required" });
    }

    const [inserted] = await db.insert(menus).values(payload).$returningId();
    const id = inserted?.idMenu;
    const [created] = await db.select().from(menus).where(eq(menus.idMenu, id));

    res.status(201).json({ data: created });
  }),
);

router.post(
  "/:id/plats/:platId",
  asyncHandler(async (req, res) => {
    const idMenu = parseId(req.params.id);
    const idPlat = parseId(req.params.platId);
    if (!idMenu || !idPlat) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    await db.insert(menusPlats).values({ idMenu, idPlat });
    res.status(201).json({ data: { idMenu, idPlat } });
  }),
);

router.post(
  "/:id/recettes/:recetteId",
  asyncHandler(async (req, res) => {
    const idMenu = parseId(req.params.id);
    const idRecette = parseId(req.params.recetteId);
    if (!idMenu || !idRecette) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    const [recipe] = await db
      .select({ idPlat: recettes.idPlat })
      .from(recettes)
      .where(eq(recettes.idRecette, idRecette));

    if (!recipe?.idPlat) {
      return res
        .status(404)
        .json({ message: "Recipe not found or not linked to a dish" });
    }

    const [existingLink] = await db
      .select()
      .from(menusPlats)
      .where(
        and(
          eq(menusPlats.idMenu, idMenu),
          eq(menusPlats.idPlat, recipe.idPlat),
        ),
      );

    if (existingLink) {
      return res
        .status(200)
        .json({ data: { idMenu, idRecette, idPlat: recipe.idPlat } });
    }

    await db.insert(menusPlats).values({ idMenu, idPlat: recipe.idPlat });
    res
      .status(201)
      .json({ data: { idMenu, idRecette, idPlat: recipe.idPlat } });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid menu id" });
    }

    const [existing] = await db
      .select()
      .from(menus)
      .where(eq(menus.idMenu, id));
    if (!existing) {
      return res.status(404).json({ message: "Menu not found" });
    }

    const payload = buildPayload(req.body);
    await db.update(menus).set(payload).where(eq(menus.idMenu, id));
    const [updated] = await db.select().from(menus).where(eq(menus.idMenu, id));

    res.json({ data: updated });
  }),
);

router.delete(
  "/:id/plats/:platId",
  asyncHandler(async (req, res) => {
    const idMenu = parseId(req.params.id);
    const idPlat = parseId(req.params.platId);
    if (!idMenu || !idPlat) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    await db
      .delete(menusPlats)
      .where(and(eq(menusPlats.idMenu, idMenu), eq(menusPlats.idPlat, idPlat)));

    res.status(204).send();
  }),
);

router.delete(
  "/:id/recettes/:recetteId",
  asyncHandler(async (req, res) => {
    const idMenu = parseId(req.params.id);
    const idRecette = parseId(req.params.recetteId);
    if (!idMenu || !idRecette) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    const [recipe] = await db
      .select({ idPlat: recettes.idPlat })
      .from(recettes)
      .where(eq(recettes.idRecette, idRecette));

    if (!recipe?.idPlat) {
      return res
        .status(404)
        .json({ message: "Recipe not found or not linked to a dish" });
    }

    await db
      .delete(menusPlats)
      .where(
        and(
          eq(menusPlats.idMenu, idMenu),
          eq(menusPlats.idPlat, recipe.idPlat),
        ),
      );

    res.status(204).send();
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid menu id" });
    }

    const [existing] = await db
      .select()
      .from(menus)
      .where(eq(menus.idMenu, id));
    if (!existing) {
      return res.status(404).json({ message: "Menu not found" });
    }

    await db.delete(menus).where(eq(menus.idMenu, id));
    res.status(204).send();
  }),
);

export default router;
