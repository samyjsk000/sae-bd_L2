import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { categories } from "../db/schema.js";
import { asyncHandler, parseId, parsePagination } from "../utils/http.js";

const router = Router();

const buildPayload = (body) => ({
  nomCategorie: body.nomCategorie,
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const rows = await db.select().from(categories).limit(limit).offset(offset);
    res.json({ data: rows, pagination: { limit, offset } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const [row] = await db
      .select()
      .from(categories)
      .where(eq(categories.idCategorie, id));
    if (!row) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ data: row });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = buildPayload(req.body);
    if (!payload.nomCategorie) {
      return res.status(400).json({ message: "nomCategorie is required" });
    }

    const [inserted] = await db
      .insert(categories)
      .values(payload)
      .$returningId();
    const id = inserted?.idCategorie;
    const [created] = await db
      .select()
      .from(categories)
      .where(eq(categories.idCategorie, id));

    res.status(201).json({ data: created });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.idCategorie, id));
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    const payload = buildPayload(req.body);
    await db
      .update(categories)
      .set(payload)
      .where(eq(categories.idCategorie, id));
    const [updated] = await db
      .select()
      .from(categories)
      .where(eq(categories.idCategorie, id));

    res.json({ data: updated });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.idCategorie, id));
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    await db.delete(categories).where(eq(categories.idCategorie, id));
    res.status(204).send();
  }),
);

export default router;
