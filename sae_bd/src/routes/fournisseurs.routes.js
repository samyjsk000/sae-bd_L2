import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import {
  fournisseurs,
  ingredientsFournisseurs,
  ingredients,
  utensilsFournisseurs,
  utensils,
} from "../db/schema.js";
import { asyncHandler, parseId, parsePagination } from "../utils/http.js";

const router = Router();

const buildPayload = (body) => ({
  nomFournisseur: body.nomFournisseur,
  localisation: body.localisation,
  contact: body.contact,
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const rows = await db
      .select()
      .from(fournisseurs)
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
      return res.status(400).json({ message: "Invalid supplier id" });
    }

    const [row] = await db
      .select()
      .from(fournisseurs)
      .where(eq(fournisseurs.idFournisseur, id));
    if (!row) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json({ data: row });
  }),
);

router.get(
  "/:id/ingredients",
  asyncHandler(async (req, res) => {
    const idFournisseur = parseId(req.params.id);
    if (!idFournisseur) {
      return res.status(400).json({ message: "Invalid supplier id" });
    }

    const rows = await db
      .select({
        idIngredient: ingredients.idIngredient,
        nomIngredient: ingredients.nomIngredient,
        uniteType: ingredients.uniteType,
        prix: ingredientsFournisseurs.prix,
      })
      .from(ingredientsFournisseurs)
      .innerJoin(
        ingredients,
        eq(ingredientsFournisseurs.idIngredient, ingredients.idIngredient),
      )
      .where(eq(ingredientsFournisseurs.idFournisseur, idFournisseur));

    res.json({ data: rows });
  }),
);

router.get(
  "/:id/utensils",
  asyncHandler(async (req, res) => {
    const idFournisseur = parseId(req.params.id);
    if (!idFournisseur) {
      return res.status(400).json({ message: "Invalid supplier id" });
    }

    const rows = await db
      .select({
        idUtensil: utensils.idUtensil,
        nomUtensile: utensils.nomUtensile,
        prix: utensilsFournisseurs.prix,
      })
      .from(utensilsFournisseurs)
      .innerJoin(
        utensils,
        eq(utensilsFournisseurs.idUtensil, utensils.idUtensil),
      )
      .where(eq(utensilsFournisseurs.idFournisseur, idFournisseur));

    res.json({ data: rows });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = buildPayload(req.body);
    if (!payload.nomFournisseur) {
      return res.status(400).json({ message: "nomFournisseur is required" });
    }

    const [inserted] = await db
      .insert(fournisseurs)
      .values(payload)
      .$returningId();
    const id = inserted?.idFournisseur;
    const [created] = await db
      .select()
      .from(fournisseurs)
      .where(eq(fournisseurs.idFournisseur, id));

    res.status(201).json({ data: created });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid supplier id" });
    }

    const [existing] = await db
      .select()
      .from(fournisseurs)
      .where(eq(fournisseurs.idFournisseur, id));
    if (!existing) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const payload = buildPayload(req.body);
    await db
      .update(fournisseurs)
      .set(payload)
      .where(eq(fournisseurs.idFournisseur, id));
    const [updated] = await db
      .select()
      .from(fournisseurs)
      .where(eq(fournisseurs.idFournisseur, id));

    res.json({ data: updated });
  }),
);

router.post(
  "/:id/ingredients/:ingredientId",
  asyncHandler(async (req, res) => {
    const idFournisseur = parseId(req.params.id);
    const idIngredient = parseId(req.params.ingredientId);
    if (!idFournisseur || !idIngredient) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    const prix = req.body.prix;

    const [existingLink] = await db
      .select()
      .from(ingredientsFournisseurs)
      .where(
        and(
          eq(ingredientsFournisseurs.idFournisseur, idFournisseur),
          eq(ingredientsFournisseurs.idIngredient, idIngredient),
        ),
      );

    if (existingLink) {
      return res.status(200).json({ data: existingLink });
    }

    await db.insert(ingredientsFournisseurs).values({
      idFournisseur,
      idIngredient,
      prix: prix == null || prix === "" ? null : String(prix),
    });

    const [created] = await db
      .select()
      .from(ingredientsFournisseurs)
      .where(
        and(
          eq(ingredientsFournisseurs.idFournisseur, idFournisseur),
          eq(ingredientsFournisseurs.idIngredient, idIngredient),
        ),
      );

    res.status(201).json({ data: created });
  }),
);

router.post(
  "/:id/utensils/:utensilId",
  asyncHandler(async (req, res) => {
    const idFournisseur = parseId(req.params.id);
    const idUtensil = parseId(req.params.utensilId);
    if (!idFournisseur || !idUtensil) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    const prix = req.body.prix;

    const [existingLink] = await db
      .select()
      .from(utensilsFournisseurs)
      .where(
        and(
          eq(utensilsFournisseurs.idFournisseur, idFournisseur),
          eq(utensilsFournisseurs.idUtensil, idUtensil),
        ),
      );

    if (existingLink) {
      return res.status(200).json({ data: existingLink });
    }

    await db.insert(utensilsFournisseurs).values({
      idFournisseur,
      idUtensil,
      prix: prix == null || prix === "" ? null : String(prix),
    });

    const [created] = await db
      .select()
      .from(utensilsFournisseurs)
      .where(
        and(
          eq(utensilsFournisseurs.idFournisseur, idFournisseur),
          eq(utensilsFournisseurs.idUtensil, idUtensil),
        ),
      );

    res.status(201).json({ data: created });
  }),
);

router.delete(
  "/:id/ingredients/:ingredientId",
  asyncHandler(async (req, res) => {
    const idFournisseur = parseId(req.params.id);
    const idIngredient = parseId(req.params.ingredientId);
    if (!idFournisseur || !idIngredient) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    await db
      .delete(ingredientsFournisseurs)
      .where(
        and(
          eq(ingredientsFournisseurs.idFournisseur, idFournisseur),
          eq(ingredientsFournisseurs.idIngredient, idIngredient),
        ),
      );

    res.status(204).send();
  }),
);

router.delete(
  "/:id/utensils/:utensilId",
  asyncHandler(async (req, res) => {
    const idFournisseur = parseId(req.params.id);
    const idUtensil = parseId(req.params.utensilId);
    if (!idFournisseur || !idUtensil) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    await db
      .delete(utensilsFournisseurs)
      .where(
        and(
          eq(utensilsFournisseurs.idFournisseur, idFournisseur),
          eq(utensilsFournisseurs.idUtensil, idUtensil),
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
      return res.status(400).json({ message: "Invalid supplier id" });
    }

    const [existing] = await db
      .select()
      .from(fournisseurs)
      .where(eq(fournisseurs.idFournisseur, id));
    if (!existing) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    await db.delete(fournisseurs).where(eq(fournisseurs.idFournisseur, id));
    res.status(204).send();
  }),
);

export default router;
