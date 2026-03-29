import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { utensils, stockUtensils } from "../db/schema.js";
import { asyncHandler, parseId, parsePagination } from "../utils/http.js";

const router = Router();

const buildPayload = (body) => ({
  nomUtensile: body.nomUtensile,
  imageUtensile: body.imageUtensile,
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const rows = await db
      .select({
        idUtensil: utensils.idUtensil,
        nomUtensile: utensils.nomUtensile,
        imageUtensile: utensils.imageUtensile,
        stock: stockUtensils.quantite,
      })
      .from(utensils)
      .leftJoin(stockUtensils, eq(stockUtensils.idUtensil, utensils.idUtensil))
      .limit(limit)
      .offset(offset);
    res.json({ data: rows, pagination: { limit, offset } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid utensil id" });
    }

    const [row] = await db
      .select()
      .from(utensils)
      .where(eq(utensils.idUtensil, id));
    if (!row) {
      return res.status(404).json({ message: "Utensil not found" });
    }

    const [stock] = await db
      .select()
      .from(stockUtensils)
      .where(eq(stockUtensils.idUtensil, id));

    res.json({ data: { ...row, stock: stock?.quantite ?? null } });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = buildPayload(req.body);
    if (!payload.nomUtensile) {
      return res.status(400).json({ message: "nomUtensile is required" });
    }

    const [inserted] = await db.insert(utensils).values(payload).$returningId();
    const id = inserted?.idUtensil;
    const [created] = await db
      .select()
      .from(utensils)
      .where(eq(utensils.idUtensil, id));

    res.status(201).json({ data: created });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid utensil id" });
    }

    const [existing] = await db
      .select()
      .from(utensils)
      .where(eq(utensils.idUtensil, id));
    if (!existing) {
      return res.status(404).json({ message: "Utensil not found" });
    }

    const payload = buildPayload(req.body);
    await db.update(utensils).set(payload).where(eq(utensils.idUtensil, id));
    const [updated] = await db
      .select()
      .from(utensils)
      .where(eq(utensils.idUtensil, id));

    res.json({ data: updated });
  }),
);

router.put(
  "/:id/stock",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid utensil id" });
    }

    const [existing] = await db
      .select()
      .from(utensils)
      .where(eq(utensils.idUtensil, id));
    if (!existing) {
      return res.status(404).json({ message: "Utensil not found" });
    }

    const quantite = Number(req.body.quantite);
    if (Number.isNaN(quantite) || quantite < 0) {
      return res
        .status(400)
        .json({ message: "quantite must be a positive number" });
    }

    const [stock] = await db
      .select()
      .from(stockUtensils)
      .where(eq(stockUtensils.idUtensil, id));

    if (stock) {
      await db
        .update(stockUtensils)
        .set({ quantite })
        .where(eq(stockUtensils.idUtensil, id));
    } else {
      await db.insert(stockUtensils).values({ idUtensil: id, quantite });
    }

    const [updatedStock] = await db
      .select()
      .from(stockUtensils)
      .where(eq(stockUtensils.idUtensil, id));

    res.json({ data: updatedStock });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid utensil id" });
    }

    const [existing] = await db
      .select()
      .from(utensils)
      .where(eq(utensils.idUtensil, id));
    if (!existing) {
      return res.status(404).json({ message: "Utensil not found" });
    }

    await db.delete(utensils).where(eq(utensils.idUtensil, id));
    res.status(204).send();
  }),
);

export default router;
