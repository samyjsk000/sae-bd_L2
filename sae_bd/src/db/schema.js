import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  decimal,
  float,
  primaryKey,
  foreignKey,
} from "drizzle-orm/mysql-core";

export const pays = mysqlTable("Pays", {
  idPays: int("idPays").autoincrement().primaryKey(),
  nomPays: varchar("nomPays", { length: 100 }),
  drapeuaPays: varchar("drapeuaPays", { length: 255 }),
  codePays: varchar("codePays", { length: 10 }),
});

export const cuisine = mysqlTable("Cuisine", {
  idCuisine: int("idCuisine").autoincrement().primaryKey(),
  nomCuisine: varchar("nomCuisine", { length: 100 }),
  imageCusine: varchar("imageCusine", { length: 255 }),
  Pays: varchar("Pays", { length: 100 }),
  description: text("description"),
  idPays: int("idPays").references(() => pays.idPays),
});

export const menus = mysqlTable("Menus", {
  idMenu: int("idMenu").autoincrement().primaryKey(),
  nomMenu: varchar("nomMenu", { length: 100 }),
  imageMenu: varchar("imageMenu", { length: 255 }),
  description: text("description"),
  creeA: datetime("creeA"),
});

export const categories = mysqlTable("Categories", {
  idCategorie: int("idCategorie").autoincrement().primaryKey(),
  nomCategorie: varchar("nomCategorie", { length: 100 }),
});

export const plats = mysqlTable("Plats", {
  idPlat: int("idPlat").autoincrement().primaryKey(),
  nomPlat: varchar("nomPlat", { length: 100 }),
  imagePlat: varchar("imagePlat", { length: 255 }),
  description: text("description"),
  idCuisine: int("idCuisine").references(() => cuisine.idCuisine),
});

export const menusPlats = mysqlTable(
  "MenusPlats",
  {
    idMenu: int("idMenu")
      .notNull()
      .references(() => menus.idMenu),
    idPlat: int("idPlat")
      .notNull()
      .references(() => plats.idPlat),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.idMenu, table.idPlat] }),
  }),
);

export const platsCategories = mysqlTable(
  "PlatsCategories",
  {
    idPlat: int("idPlat")
      .notNull()
      .references(() => plats.idPlat),
    idCategorie: int("idCategorie")
      .notNull()
      .references(() => categories.idCategorie),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.idPlat, table.idCategorie] }),
  }),
);

export const ingredients = mysqlTable("Ingredients", {
  idIngredient: int("idIngredient").autoincrement().primaryKey(),
  nomIngredient: varchar("nomIngredient", { length: 100 }),
  imageIngredient: varchar("imageIngredient", { length: 255 }),
  uniteType: varchar("uniteType", { length: 50 }),
});

export const fournisseurs = mysqlTable("Fournisseurs", {
  idFournisseur: int("idFournisseur").autoincrement().primaryKey(),
  nomFournisseur: varchar("nomFournisseur", { length: 100 }),
  localisation: varchar("localisation", { length: 150 }),
  contact: varchar("contact", { length: 150 }),
});

export const ingredientsFournisseurs = mysqlTable(
  "IngredientsFournisseurs",
  {
    idIngredient: int("idIngredient").notNull(),
    idFournisseur: int("idFournisseur").notNull(),
    prix: decimal("prix", { precision: 10, scale: 2 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.idIngredient, table.idFournisseur] }),
    ingredientFk: foreignKey({
      name: "if_ingredient_fk",
      columns: [table.idIngredient],
      foreignColumns: [ingredients.idIngredient],
    }),
    fournisseurFk: foreignKey({
      name: "if_fournisseur_fk",
      columns: [table.idFournisseur],
      foreignColumns: [fournisseurs.idFournisseur],
    }),
  }),
);

export const recettes = mysqlTable("Recettes", {
  idRecette: int("idRecette").autoincrement().primaryKey(),
  nomRecette: varchar("nomRecette", { length: 100 }),
  tempsPrep: int("tempsPrep"),
  creeA: datetime("creeA"),
  idPlat: int("idPlat").references(() => plats.idPlat),
});

export const recettesIngredients = mysqlTable(
  "RecettesIngredients",
  {
    idRecette: int("idRecette")
      .notNull()
      .references(() => recettes.idRecette),
    idIngredient: int("idIngredient")
      .notNull()
      .references(() => ingredients.idIngredient),
    nbrIngredient: decimal("nbrIngredient", { precision: 10, scale: 2 }),
    unite: varchar("unite", { length: 50 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.idRecette, table.idIngredient] }),
  }),
);

export const etapes = mysqlTable("Etapes", {
  idEtape: int("idEtape").autoincrement().primaryKey(),
  numeroEtape: int("numeroEtape"),
  textEtape: text("textEtape"),
  idRecette: int("idRecette").references(() => recettes.idRecette),
});

export const nutritions = mysqlTable("Nutritions", {
  idNutritions: int("idNutritions").autoincrement().primaryKey(),
  calories: int("calories"),
  grasse: float("grasse"),
  carbs: float("carbs"),
  fibres: float("fibres"),
  sucre: float("sucre"),
  proteines: float("proteines"),
  idRecette: int("idRecette").references(() => recettes.idRecette),
});

export const utensils = mysqlTable("Utensils", {
  idUtensil: int("idUtensil").autoincrement().primaryKey(),
  nomUtensile: varchar("nomUtensile", { length: 100 }),
  imageUtensile: varchar("imageUtensile", { length: 255 }),
});

export const utensilsFournisseurs = mysqlTable(
  "UtensilsFournisseurs",
  {
    idUtensil: int("idUtensil").notNull(),
    idFournisseur: int("idFournisseur").notNull(),
    prix: decimal("prix", { precision: 10, scale: 2 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.idUtensil, table.idFournisseur] }),
    utensilFk: foreignKey({
      name: "uf_utensil_fk",
      columns: [table.idUtensil],
      foreignColumns: [utensils.idUtensil],
    }),
    fournisseurFk: foreignKey({
      name: "uf_fournisseur_fk",
      columns: [table.idFournisseur],
      foreignColumns: [fournisseurs.idFournisseur],
    }),
  }),
);

export const utensilsRecettes = mysqlTable(
  "UtensilsRecettes",
  {
    idUtensil: int("idUtensil")
      .notNull()
      .references(() => utensils.idUtensil),
    idRecette: int("idRecette")
      .notNull()
      .references(() => recettes.idRecette),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.idUtensil, table.idRecette] }),
  }),
);

export const restrictions = mysqlTable("Restrictions", {
  idRestriction: int("idRestriction").autoincrement().primaryKey(),
  nomRestriction: varchar("nomRestriction", { length: 100 }),
  description: text("description"),
});

export const restrictionsIngredients = mysqlTable(
  "RestrictionsIngredients",
  {
    idRestriction: int("idRestriction").notNull(),
    idIngredient: int("idIngredient").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.idRestriction, table.idIngredient] }),
    restrictionFk: foreignKey({
      name: "ri_restriction_fk",
      columns: [table.idRestriction],
      foreignColumns: [restrictions.idRestriction],
    }),
    ingredientFk: foreignKey({
      name: "ri_ingredient_fk",
      columns: [table.idIngredient],
      foreignColumns: [ingredients.idIngredient],
    }),
  }),
);

export const stockIngredient = mysqlTable("StockIngredient", {
  idIngredient: int("idIngredient")
    .primaryKey()
    .references(() => ingredients.idIngredient),
  quantite: decimal("quantite", { precision: 10, scale: 2 }),
});

export const stockUtensils = mysqlTable("StockUtensils", {
  idUtensil: int("idUtensil")
    .primaryKey()
    .references(() => utensils.idUtensil),
  quantite: int("quantite"),
});
