import { Router } from "express";
import { and, asc, eq, like } from "drizzle-orm";
import { db } from "../db/connection.js";
import {
  recettes,
  plats,
  etapes,
  nutritions,
  recettesIngredients,
  ingredients,
  utensilsRecettes,
  utensils,
} from "../db/schema.js";
import { asyncHandler, parseId, parsePagination } from "../utils/http.js";

const router = Router();

const buildPayload = (body) => ({
  nomRecette: body.nomRecette,
  tempsPrep: body.tempsPrep,
  creeA: body.creeA ? new Date(body.creeA) : new Date(),
  idPlat: body.idPlat,
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const q = req.query.q?.trim();

    const rows = q
      ? await db
          .select()
          .from(recettes)
          .where(like(recettes.nomRecette, `%${q}%`))
          .limit(limit)
          .offset(offset)
      : await db.select().from(recettes).limit(limit).offset(offset);

    res.json({ data: rows, pagination: { limit, offset } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid recipe id" });
    }

    const [row] = await db
      .select()
      .from(recettes)
      .where(eq(recettes.idRecette, id));
    if (!row) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json({ data: row });
  }),
);

router.get(
  "/:id/full",
  asyncHandler(async (req, res) => {
    const idRecette = parseId(req.params.id);
    if (!idRecette) {
      return res.status(400).json({ message: "Invalid recipe id" });
    }

    const [recipe] = await db
      .select({
        idRecette: recettes.idRecette,
        nomRecette: recettes.nomRecette,
        tempsPrep: recettes.tempsPrep,
        creeA: recettes.creeA,
        idPlat: recettes.idPlat,
        nomPlat: plats.nomPlat,
      })
      .from(recettes)
      .leftJoin(plats, eq(recettes.idPlat, plats.idPlat))
      .where(eq(recettes.idRecette, idRecette));

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const recipeSteps = await db
      .select()
      .from(etapes)
      .where(eq(etapes.idRecette, idRecette))
      .orderBy(asc(etapes.numeroEtape));

    const recipeIngredients = await db
      .select({
        idIngredient: recettesIngredients.idIngredient,
        nomIngredient: ingredients.nomIngredient,
        nbrIngredient: recettesIngredients.nbrIngredient,
        unite: recettesIngredients.unite,
      })
      .from(recettesIngredients)
      .innerJoin(
        ingredients,
        eq(recettesIngredients.idIngredient, ingredients.idIngredient),
      )
      .where(eq(recettesIngredients.idRecette, idRecette));

    const [nutrition] = await db
      .select()
      .from(nutritions)
      .where(eq(nutritions.idRecette, idRecette));

    const recipeUtensils = await db
      .select({
        idUtensil: utensils.idUtensil,
        nomUtensile: utensils.nomUtensile,
        imageUtensile: utensils.imageUtensile,
      })
      .from(utensilsRecettes)
      .innerJoin(utensils, eq(utensilsRecettes.idUtensil, utensils.idUtensil))
      .where(eq(utensilsRecettes.idRecette, idRecette));

    res.json({
      data: {
        ...recipe,
        etapes: recipeSteps,
        ingredients: recipeIngredients,
        nutrition: nutrition || null,
        utensils: recipeUtensils,
      },
    });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = buildPayload(req.body);
    if (!payload.nomRecette) {
      return res.status(400).json({ message: "nomRecette is required" });
    }

    const [inserted] = await db.insert(recettes).values(payload).$returningId();
    const id = inserted?.idRecette;
    const [created] = await db
      .select()
      .from(recettes)
      .where(eq(recettes.idRecette, id));

    res.status(201).json({ data: created });
  }),
);

router.post(
  "/:id/ingredients",
  asyncHandler(async (req, res) => {
    const idRecette = parseId(req.params.id);
    const idIngredient = parseId(req.body.idIngredient);
    if (!idRecette || !idIngredient) {
      return res
        .status(400)
        .json({ message: "idIngredient and idRecette are required" });
    }

    const nbrIngredient = Number(req.body.nbrIngredient);
    const unite = req.body.unite || null;
    if (Number.isNaN(nbrIngredient) || nbrIngredient <= 0) {
      return res
        .status(400)
        .json({ message: "nbrIngredient must be a positive number" });
    }

    await db.insert(recettesIngredients).values({
      idRecette,
      idIngredient,
      nbrIngredient: nbrIngredient.toString(),
      unite,
    });

    const [created] = await db
      .select()
      .from(recettesIngredients)
      .where(
        and(
          eq(recettesIngredients.idRecette, idRecette),
          eq(recettesIngredients.idIngredient, idIngredient),
        ),
      );

    res.status(201).json({ data: created });
  }),
);

router.post(
  "/:id/etapes",
  asyncHandler(async (req, res) => {
    const idRecette = parseId(req.params.id);
    if (!idRecette) {
      return res.status(400).json({ message: "Invalid recipe id" });
    }

    const numeroEtape = Number(req.body.numeroEtape);
    if (
      !Number.isInteger(numeroEtape) ||
      numeroEtape <= 0 ||
      !req.body.textEtape
    ) {
      return res
        .status(400)
        .json({ message: "numeroEtape and textEtape are required" });
    }

    const [inserted] = await db
      .insert(etapes)
      .values({
        idRecette,
        numeroEtape,
        textEtape: req.body.textEtape,
      })
      .$returningId();

    const idEtape = inserted?.idEtape;
    const [created] = await db
      .select()
      .from(etapes)
      .where(eq(etapes.idEtape, idEtape));
    res.status(201).json({ data: created });
  }),
);

router.put(
  "/:id/nutrition",
  asyncHandler(async (req, res) => {
    const idRecette = parseId(req.params.id);
    if (!idRecette) {
      return res.status(400).json({ message: "Invalid recipe id" });
    }

    const payload = {
      calories: req.body.calories ?? null,
      grasse: req.body.grasse ?? null,
      carbs: req.body.carbs ?? null,
      fibres: req.body.fibres ?? null,
      sucre: req.body.sucre ?? null,
      proteines: req.body.proteines ?? null,
      idRecette,
    };

    const [existing] = await db
      .select()
      .from(nutritions)
      .where(eq(nutritions.idRecette, idRecette));

    if (existing) {
      await db
        .update(nutritions)
        .set(payload)
        .where(eq(nutritions.idRecette, idRecette));
    } else {
      await db.insert(nutritions).values(payload);
    }

    const [updated] = await db
      .select()
      .from(nutritions)
      .where(eq(nutritions.idRecette, idRecette));

    res.json({ data: updated });
  }),
);

router.post(
  "/:id/utensils/:utensilId",
  asyncHandler(async (req, res) => {
    const idRecette = parseId(req.params.id);
    const idUtensil = parseId(req.params.utensilId);
    if (!idRecette || !idUtensil) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    await db.insert(utensilsRecettes).values({ idRecette, idUtensil });
    res.status(201).json({ data: { idRecette, idUtensil } });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid recipe id" });
    }

    const [existing] = await db
      .select()
      .from(recettes)
      .where(eq(recettes.idRecette, id));
    if (!existing) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const payload = buildPayload(req.body);
    await db.update(recettes).set(payload).where(eq(recettes.idRecette, id));
    const [updated] = await db
      .select()
      .from(recettes)
      .where(eq(recettes.idRecette, id));

    res.json({ data: updated });
  }),
);

router.delete(
  "/:id/ingredients/:ingredientId",
  asyncHandler(async (req, res) => {
    const idRecette = parseId(req.params.id);
    const idIngredient = parseId(req.params.ingredientId);
    if (!idRecette || !idIngredient) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    await db
      .delete(recettesIngredients)
      .where(
        and(
          eq(recettesIngredients.idRecette, idRecette),
          eq(recettesIngredients.idIngredient, idIngredient),
        ),
      );

    res.status(204).send();
  }),
);

router.delete(
  "/:id/utensils/:utensilId",
  asyncHandler(async (req, res) => {
    const idRecette = parseId(req.params.id);
    const idUtensil = parseId(req.params.utensilId);
    if (!idRecette || !idUtensil) {
      return res.status(400).json({ message: "Invalid ids" });
    }

    await db
      .delete(utensilsRecettes)
      .where(
        and(
          eq(utensilsRecettes.idRecette, idRecette),
          eq(utensilsRecettes.idUtensil, idUtensil),
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
      return res.status(400).json({ message: "Invalid recipe id" });
    }

    const [existing] = await db
      .select()
      .from(recettes)
      .where(eq(recettes.idRecette, id));
    if (!existing) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    await db.delete(recettes).where(eq(recettes.idRecette, id));
    res.status(204).send();
  }),
);

export default router;
