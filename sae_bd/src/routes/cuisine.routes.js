import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { cuisine } from "../db/schema.js";
import { asyncHandler, parseId, parsePagination } from "../utils/http.js";

const router = Router();

const buildPayload = (body) => ({
  nomCuisine: body.nomCuisine,
  imageCusine: body.imageCusine,
  Pays: body.Pays,
  description: body.description,
  idPays: body.idPays,
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const rows = await db.select().from(cuisine).limit(limit).offset(offset);
    res.json({ data: rows, pagination: { limit, offset } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid cuisine id" });
    }

    const [row] = await db
      .select()
      .from(cuisine)
      .where(eq(cuisine.idCuisine, id));
    if (!row) {
      return res.status(404).json({ message: "Cuisine not found" });
    }

    res.json({ data: row });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = buildPayload(req.body);
    if (!payload.nomCuisine) {
      return res.status(400).json({ message: "nomCuisine is required" });
    }

    const [inserted] = await db.insert(cuisine).values(payload).$returningId();
    const id = inserted?.idCuisine;
    const [created] = await db
      .select()
      .from(cuisine)
      .where(eq(cuisine.idCuisine, id));

    res.status(201).json({ data: created });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid cuisine id" });
    }

    const [existing] = await db
      .select()
      .from(cuisine)
      .where(eq(cuisine.idCuisine, id));
    if (!existing) {
      return res.status(404).json({ message: "Cuisine not found" });
    }

    const payload = buildPayload(req.body);
    await db.update(cuisine).set(payload).where(eq(cuisine.idCuisine, id));
    const [updated] = await db
      .select()
      .from(cuisine)
      .where(eq(cuisine.idCuisine, id));

    res.json({ data: updated });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid cuisine id" });
    }

    const [existing] = await db
      .select()
      .from(cuisine)
      .where(eq(cuisine.idCuisine, id));
    if (!existing) {
      return res.status(404).json({ message: "Cuisine not found" });
    }

    await db.delete(cuisine).where(eq(cuisine.idCuisine, id));
    res.status(204).send();
  }),
);

export default router;
