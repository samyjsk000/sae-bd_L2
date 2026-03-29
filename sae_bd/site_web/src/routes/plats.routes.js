import { Router } from "express";
import { eq, like } from "drizzle-orm";
import { db } from "../db/connection.js";
import { plats, recettes, platsCategories } from "../db/schema.js";
import { asyncHandler, parseId, parsePagination } from "../utils/http.js";

const router = Router();

const buildPayload = (body) => ({
  nomPlat: body.nomPlat,
  imagePlat: body.imagePlat,
  description: body.description,
  idCuisine: body.idCuisine,
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const q = req.query.q?.trim();

    const rows = q
      ? await db
          .select()
          .from(plats)
          .where(like(plats.nomPlat, `%${q}%`))
          .limit(limit)
          .offset(offset)
      : await db.select().from(plats).limit(limit).offset(offset);

    res.json({ data: rows, pagination: { limit, offset } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid plat id" });
    }

    const [row] = await db.select().from(plats).where(eq(plats.idPlat, id));
    if (!row) {
      return res.status(404).json({ message: "Plat not found" });
    }

    res.json({ data: row });
  }),
);

router.get(
  "/:id/recettes",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid plat id" });
    }

    const rows = await db
      .select()
      .from(recettes)
      .where(eq(recettes.idPlat, id));
    res.json({ data: rows });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = buildPayload(req.body);
    if (!payload.nomPlat) {
      return res.status(400).json({ message: "nomPlat is required" });
    }

    const [inserted] = await db.insert(plats).values(payload).$returningId();
    const id = inserted?.idPlat;
    const [created] = await db.select().from(plats).where(eq(plats.idPlat, id));

    res.status(201).json({ data: created });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid plat id" });
    }

    const [existing] = await db
      .select()
      .from(plats)
      .where(eq(plats.idPlat, id));
    if (!existing) {
      return res.status(404).json({ message: "Plat not found" });
    }

    const payload = buildPayload(req.body);
    await db.update(plats).set(payload).where(eq(plats.idPlat, id));
    const [updated] = await db.select().from(plats).where(eq(plats.idPlat, id));

    res.json({ data: updated });
  }),
);

router.post(
  "/:id/categories/:categorieId",
  asyncHandler(async (req, res) => {
    const idPlat = parseId(req.params.id);
    const idCategorie = parseId(req.params.categorieId);
    if (!idPlat || !idCategorie) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    await db.insert(platsCategories).values({ idPlat, idCategorie });
    res.status(201).json({ data: { idPlat, idCategorie } });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid plat id" });
    }

    const [existing] = await db
      .select()
      .from(plats)
      .where(eq(plats.idPlat, id));
    if (!existing) {
      return res.status(404).json({ message: "Plat not found" });
    }

    await db.delete(plats).where(eq(plats.idPlat, id));
    res.status(204).send();
  }),
);

export default router;
