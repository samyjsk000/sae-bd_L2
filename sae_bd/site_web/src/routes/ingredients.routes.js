import { Router } from "express";
import { eq, like } from "drizzle-orm";
import { db } from "../db/connection.js";
import { ingredients, stockIngredient } from "../db/schema.js";
import { asyncHandler, parseId, parsePagination } from "../utils/http.js";

const router = Router();

const buildPayload = (body) => ({
  nomIngredient: body.nomIngredient,
  imageIngredient: body.imageIngredient,
  uniteType: body.uniteType,
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const q = req.query.q?.trim();

    const rows = q
      ? await db
          .select({
            idIngredient: ingredients.idIngredient,
            nomIngredient: ingredients.nomIngredient,
            imageIngredient: ingredients.imageIngredient,
            uniteType: ingredients.uniteType,
            stock: stockIngredient.quantite,
          })
          .from(ingredients)
          .leftJoin(
            stockIngredient,
            eq(stockIngredient.idIngredient, ingredients.idIngredient),
          )
          .where(like(ingredients.nomIngredient, `%${q}%`))
          .limit(limit)
          .offset(offset)
      : await db
          .select({
            idIngredient: ingredients.idIngredient,
            nomIngredient: ingredients.nomIngredient,
            imageIngredient: ingredients.imageIngredient,
            uniteType: ingredients.uniteType,
            stock: stockIngredient.quantite,
          })
          .from(ingredients)
          .leftJoin(
            stockIngredient,
            eq(stockIngredient.idIngredient, ingredients.idIngredient),
          )
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
      return res.status(400).json({ message: "Invalid ingredient id" });
    }

    const [row] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.idIngredient, id));
    if (!row) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    const [stock] = await db
      .select()
      .from(stockIngredient)
      .where(eq(stockIngredient.idIngredient, id));

    res.json({ data: { ...row, stock: stock?.quantite ?? null } });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = buildPayload(req.body);
    if (!payload.nomIngredient) {
      return res.status(400).json({ message: "nomIngredient is required" });
    }

    const [inserted] = await db
      .insert(ingredients)
      .values(payload)
      .$returningId();
    const id = inserted?.idIngredient;
    const [created] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.idIngredient, id));

    res.status(201).json({ data: created });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid ingredient id" });
    }

    const [existing] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.idIngredient, id));
    if (!existing) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    const payload = buildPayload(req.body);
    await db
      .update(ingredients)
      .set(payload)
      .where(eq(ingredients.idIngredient, id));
    const [updated] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.idIngredient, id));

    res.json({ data: updated });
  }),
);

router.put(
  "/:id/stock",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid ingredient id" });
    }

    const [existing] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.idIngredient, id));
    if (!existing) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    const quantite = Number(req.body.quantite);
    if (Number.isNaN(quantite) || quantite < 0) {
      return res
        .status(400)
        .json({ message: "quantite must be a positive number" });
    }

    const [stock] = await db
      .select()
      .from(stockIngredient)
      .where(eq(stockIngredient.idIngredient, id));

    if (stock) {
      await db
        .update(stockIngredient)
        .set({ quantite: quantite.toString() })
        .where(eq(stockIngredient.idIngredient, id));
    } else {
      await db.insert(stockIngredient).values({
        idIngredient: id,
        quantite: quantite.toString(),
      });
    }

    const [updatedStock] = await db
      .select()
      .from(stockIngredient)
      .where(eq(stockIngredient.idIngredient, id));

    res.json({ data: updatedStock });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid ingredient id" });
    }

    const [existing] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.idIngredient, id));
    if (!existing) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    await db.delete(ingredients).where(eq(ingredients.idIngredient, id));
    res.status(204).send();
  }),
);

export default router;
