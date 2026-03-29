import { and, eq } from "drizzle-orm";
import { db, pool } from "../src/db/connection.js";
import {
  pays,
  cuisine,
  categories,
  ingredients,
  fournisseurs,
  ingredientsFournisseurs,
  stockIngredient,
  plats,
  platsCategories,
  recettes,
  recettesIngredients,
  etapes,
  nutritions,
  utensils,
  utensilsRecettes,
  menus,
  menusPlats,
} from "../src/db/schema.js";

const findBy = async (table, column, value) => {
  const [row] = await db.select().from(table).where(eq(column, value)).limit(1);
  return row || null;
};

const findLink = async (
  table,
  leftColumn,
  leftValue,
  rightColumn,
  rightValue,
) => {
  const [row] = await db
    .select()
    .from(table)
    .where(and(eq(leftColumn, leftValue), eq(rightColumn, rightValue)))
    .limit(1);
  return row || null;
};

const insertOne = async (table, values, idKey) => {
  const [inserted] = await db.insert(table).values(values).$returningId();
  return inserted?.[idKey];
};

const ensureRecord = async ({
  table,
  idKey,
  uniqueColumn,
  uniqueValue,
  values,
}) => {
  const existing = await findBy(table, uniqueColumn, uniqueValue);
  if (existing) {
    return existing[idKey];
  }

  const id = await insertOne(table, values, idKey);
  return id;
};

const ensureLink = async ({
  table,
  leftColumn,
  leftValue,
  rightColumn,
  rightValue,
  values,
}) => {
  const existing = await findLink(
    table,
    leftColumn,
    leftValue,
    rightColumn,
    rightValue,
  );
  if (existing) {
    return;
  }

  await db.insert(table).values(values);
};

async function seed() {
  try {
    console.log("Seeding database with sample data...");

    const franceId = await ensureRecord({
      table: pays,
      idKey: "idPays",
      uniqueColumn: pays.codePays,
      uniqueValue: "FR",
      values: {
        nomPays: "France",
        drapeuaPays: "https://flagcdn.com/fr.svg",
        codePays: "FR",
      },
    });

    const italyId = await ensureRecord({
      table: pays,
      idKey: "idPays",
      uniqueColumn: pays.codePays,
      uniqueValue: "IT",
      values: {
        nomPays: "Italie",
        drapeuaPays: "https://flagcdn.com/it.svg",
        codePays: "IT",
      },
    });

    const frenchCuisineId = await ensureRecord({
      table: cuisine,
      idKey: "idCuisine",
      uniqueColumn: cuisine.nomCuisine,
      uniqueValue: "Cuisine Francaise",
      values: {
        nomCuisine: "Cuisine Francaise",
        imageCusine:
          "https://images.unsplash.com/photo-1551218808-94e220e084d2",
        Pays: "France",
        description: "Recettes traditionnelles et produits frais.",
        idPays: franceId,
      },
    });

    const italianCuisineId = await ensureRecord({
      table: cuisine,
      idKey: "idCuisine",
      uniqueColumn: cuisine.nomCuisine,
      uniqueValue: "Cuisine Italienne",
      values: {
        nomCuisine: "Cuisine Italienne",
        imageCusine:
          "https://images.unsplash.com/photo-1498837167922-ddd27525d352",
        Pays: "Italie",
        description:
          "Cuisine mediterraneenne basee sur des ingredients simples.",
        idPays: italyId,
      },
    });

    const catPlatPrincipalId = await ensureRecord({
      table: categories,
      idKey: "idCategorie",
      uniqueColumn: categories.nomCategorie,
      uniqueValue: "Plat principal",
      values: { nomCategorie: "Plat principal" },
    });

    const catVegetarienId = await ensureRecord({
      table: categories,
      idKey: "idCategorie",
      uniqueColumn: categories.nomCategorie,
      uniqueValue: "Vegetarien",
      values: { nomCategorie: "Vegetarien" },
    });

    const tomatoId = await ensureRecord({
      table: ingredients,
      idKey: "idIngredient",
      uniqueColumn: ingredients.nomIngredient,
      uniqueValue: "Tomate",
      values: {
        nomIngredient: "Tomate",
        imageIngredient:
          "https://images.unsplash.com/photo-1546094096-0df4bcaaa337",
        uniteType: "g",
      },
    });

    const basilicId = await ensureRecord({
      table: ingredients,
      idKey: "idIngredient",
      uniqueColumn: ingredients.nomIngredient,
      uniqueValue: "Basilic",
      values: {
        nomIngredient: "Basilic",
        imageIngredient:
          "https://images.unsplash.com/photo-1615485290382-441e4d049cb5",
        uniteType: "g",
      },
    });

    const pastaId = await ensureRecord({
      table: ingredients,
      idKey: "idIngredient",
      uniqueColumn: ingredients.nomIngredient,
      uniqueValue: "Pates",
      values: {
        nomIngredient: "Pates",
        imageIngredient:
          "https://images.unsplash.com/photo-1556761223-4c4282c73f77",
        uniteType: "g",
      },
    });

    const oliveOilId = await ensureRecord({
      table: ingredients,
      idKey: "idIngredient",
      uniqueColumn: ingredients.nomIngredient,
      uniqueValue: "Huile d'olive",
      values: {
        nomIngredient: "Huile d'olive",
        imageIngredient:
          "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5",
        uniteType: "ml",
      },
    });

    const primeurId = await ensureRecord({
      table: fournisseurs,
      idKey: "idFournisseur",
      uniqueColumn: fournisseurs.nomFournisseur,
      uniqueValue: "Primeur Local",
      values: {
        nomFournisseur: "Primeur Local",
        localisation: "Lyon",
        contact: "primeur@example.com",
      },
    });

    const grossisteId = await ensureRecord({
      table: fournisseurs,
      idKey: "idFournisseur",
      uniqueColumn: fournisseurs.nomFournisseur,
      uniqueValue: "Grossiste Med",
      values: {
        nomFournisseur: "Grossiste Med",
        localisation: "Marseille",
        contact: "grossiste@example.com",
      },
    });

    await ensureLink({
      table: ingredientsFournisseurs,
      leftColumn: ingredientsFournisseurs.idIngredient,
      leftValue: tomatoId,
      rightColumn: ingredientsFournisseurs.idFournisseur,
      rightValue: primeurId,
      values: {
        idIngredient: tomatoId,
        idFournisseur: primeurId,
        prix: "2.20",
      },
    });

    await ensureLink({
      table: ingredientsFournisseurs,
      leftColumn: ingredientsFournisseurs.idIngredient,
      leftValue: pastaId,
      rightColumn: ingredientsFournisseurs.idFournisseur,
      rightValue: grossisteId,
      values: {
        idIngredient: pastaId,
        idFournisseur: grossisteId,
        prix: "1.80",
      },
    });

    await ensureRecord({
      table: stockIngredient,
      idKey: "idIngredient",
      uniqueColumn: stockIngredient.idIngredient,
      uniqueValue: tomatoId,
      values: { idIngredient: tomatoId, quantite: "1500.00" },
    });

    await ensureRecord({
      table: stockIngredient,
      idKey: "idIngredient",
      uniqueColumn: stockIngredient.idIngredient,
      uniqueValue: pastaId,
      values: { idIngredient: pastaId, quantite: "2200.00" },
    });

    await ensureRecord({
      table: stockIngredient,
      idKey: "idIngredient",
      uniqueColumn: stockIngredient.idIngredient,
      uniqueValue: oliveOilId,
      values: { idIngredient: oliveOilId, quantite: "900.00" },
    });

    const pastaDishId = await ensureRecord({
      table: plats,
      idKey: "idPlat",
      uniqueColumn: plats.nomPlat,
      uniqueValue: "Pasta Pomodoro",
      values: {
        nomPlat: "Pasta Pomodoro",
        imagePlat:
          "https://images.unsplash.com/photo-1473093295043-cdd812d0e601",
        description: "Pates sauce tomate et basilic.",
        idCuisine: italianCuisineId,
      },
    });

    const ratatouilleDishId = await ensureRecord({
      table: plats,
      idKey: "idPlat",
      uniqueColumn: plats.nomPlat,
      uniqueValue: "Ratatouille Maison",
      values: {
        nomPlat: "Ratatouille Maison",
        imagePlat:
          "https://images.unsplash.com/photo-1608032364895-0da67af36cd2",
        description: "Legumes mijotes a l'huile d'olive.",
        idCuisine: frenchCuisineId,
      },
    });

    await ensureLink({
      table: platsCategories,
      leftColumn: platsCategories.idPlat,
      leftValue: pastaDishId,
      rightColumn: platsCategories.idCategorie,
      rightValue: catPlatPrincipalId,
      values: { idPlat: pastaDishId, idCategorie: catPlatPrincipalId },
    });

    await ensureLink({
      table: platsCategories,
      leftColumn: platsCategories.idPlat,
      leftValue: ratatouilleDishId,
      rightColumn: platsCategories.idCategorie,
      rightValue: catVegetarienId,
      values: { idPlat: ratatouilleDishId, idCategorie: catVegetarienId },
    });

    const recipeId = await ensureRecord({
      table: recettes,
      idKey: "idRecette",
      uniqueColumn: recettes.nomRecette,
      uniqueValue: "Pasta Pomodoro Rapide",
      values: {
        nomRecette: "Pasta Pomodoro Rapide",
        tempsPrep: 20,
        creeA: new Date(),
        idPlat: pastaDishId,
      },
    });

    await ensureLink({
      table: recettesIngredients,
      leftColumn: recettesIngredients.idRecette,
      leftValue: recipeId,
      rightColumn: recettesIngredients.idIngredient,
      rightValue: pastaId,
      values: {
        idRecette: recipeId,
        idIngredient: pastaId,
        nbrIngredient: "250.00",
        unite: "g",
      },
    });

    await ensureLink({
      table: recettesIngredients,
      leftColumn: recettesIngredients.idRecette,
      leftValue: recipeId,
      rightColumn: recettesIngredients.idIngredient,
      rightValue: tomatoId,
      values: {
        idRecette: recipeId,
        idIngredient: tomatoId,
        nbrIngredient: "180.00",
        unite: "g",
      },
    });

    const step1 = await findBy(
      etapes,
      etapes.textEtape,
      "Faire cuire les pates al dente.",
    );
    if (!step1) {
      await db.insert(etapes).values({
        idRecette: recipeId,
        numeroEtape: 1,
        textEtape: "Faire cuire les pates al dente.",
      });
    }

    const step2 = await findBy(
      etapes,
      etapes.textEtape,
      "Faire revenir la tomate avec l'huile, puis ajouter le basilic.",
    );
    if (!step2) {
      await db.insert(etapes).values({
        idRecette: recipeId,
        numeroEtape: 2,
        textEtape:
          "Faire revenir la tomate avec l'huile, puis ajouter le basilic.",
      });
    }

    await ensureRecord({
      table: nutritions,
      idKey: "idNutritions",
      uniqueColumn: nutritions.idRecette,
      uniqueValue: recipeId,
      values: {
        calories: 520,
        grasse: 14,
        carbs: 82,
        fibres: 6,
        sucre: 8,
        proteines: 15,
        idRecette: recipeId,
      },
    });

    const poeleId = await ensureRecord({
      table: utensils,
      idKey: "idUtensil",
      uniqueColumn: utensils.nomUtensile,
      uniqueValue: "Poele",
      values: {
        nomUtensile: "Poele",
        imageUtensile:
          "https://images.unsplash.com/photo-1584992236310-6edddc08acff",
      },
    });

    const casseroleId = await ensureRecord({
      table: utensils,
      idKey: "idUtensil",
      uniqueColumn: utensils.nomUtensile,
      uniqueValue: "Casserole",
      values: {
        nomUtensile: "Casserole",
        imageUtensile:
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f",
      },
    });

    await ensureLink({
      table: utensilsRecettes,
      leftColumn: utensilsRecettes.idRecette,
      leftValue: recipeId,
      rightColumn: utensilsRecettes.idUtensil,
      rightValue: poeleId,
      values: { idRecette: recipeId, idUtensil: poeleId },
    });

    await ensureLink({
      table: utensilsRecettes,
      leftColumn: utensilsRecettes.idRecette,
      leftValue: recipeId,
      rightColumn: utensilsRecettes.idUtensil,
      rightValue: casseroleId,
      values: { idRecette: recipeId, idUtensil: casseroleId },
    });

    const menuId = await ensureRecord({
      table: menus,
      idKey: "idMenu",
      uniqueColumn: menus.nomMenu,
      uniqueValue: "Menu Semaine",
      values: {
        nomMenu: "Menu Semaine",
        imageMenu:
          "https://images.unsplash.com/photo-1541544741938-0af808871cc0",
        description: "Selection de plats simples pour la semaine.",
        creeA: new Date(),
      },
    });

    await ensureLink({
      table: menusPlats,
      leftColumn: menusPlats.idMenu,
      leftValue: menuId,
      rightColumn: menusPlats.idPlat,
      rightValue: pastaDishId,
      values: { idMenu: menuId, idPlat: pastaDishId },
    });

    await ensureLink({
      table: menusPlats,
      leftColumn: menusPlats.idMenu,
      leftValue: menuId,
      rightColumn: menusPlats.idPlat,
      rightValue: ratatouilleDishId,
      values: { idMenu: menuId, idPlat: ratatouilleDishId },
    });

    console.log("Seeding finished successfully.");
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
