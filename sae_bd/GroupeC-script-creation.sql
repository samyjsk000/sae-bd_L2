CREATE DATABASE IF NOT EXISTS cooking_db;
USE cooking_db;

-- =======================
-- PAYS
-- =======================
CREATE TABLE Pays (
    idPays INT AUTO_INCREMENT PRIMARY KEY,
    nomPays VARCHAR(100),
    drapeuaPays VARCHAR(255),
    codePays VARCHAR(10)
);

-- =======================
-- CUISINE
-- =======================
CREATE TABLE Cuisine (
    idCuisine INT AUTO_INCREMENT PRIMARY KEY,
    nomCuisine VARCHAR(100),
    imageCusine VARCHAR(255),
    Pays VARCHAR(100),
    description TEXT,
    idPays INT,
    FOREIGN KEY (idPays) REFERENCES Pays(idPays)
);

-- =======================
-- MENUS
-- =======================
CREATE TABLE Menus (
    idMenu INT AUTO_INCREMENT PRIMARY KEY,
    nomMenu VARCHAR(100),
    imageMenu VARCHAR(255),
    description TEXT,
    creeA DATETIME
);

-- =======================
-- CATEGORIES
-- =======================
CREATE TABLE Categories (
    idCategorie INT AUTO_INCREMENT PRIMARY KEY,
    nomCategorie VARCHAR(100)
);

-- =======================
-- PLATS
-- =======================
CREATE TABLE Plats (
    idPlat INT AUTO_INCREMENT PRIMARY KEY,
    nomPlat VARCHAR(100),
    imagePlat VARCHAR(255),
    description TEXT,
    idCuisine INT,
    FOREIGN KEY (idCuisine) REFERENCES Cuisine(idCuisine)
);

-- =======================
-- MENUS_PLATS
-- =======================
CREATE TABLE MenusPlats (
    idMenu INT,
    idPlat INT,
    PRIMARY KEY (idMenu, idPlat),
    FOREIGN KEY (idMenu) REFERENCES Menus(idMenu),
    FOREIGN KEY (idPlat) REFERENCES Plats(idPlat)
);

-- =======================
-- PLATS_CATEGORIES
-- =======================
CREATE TABLE PlatsCategories (
    idPlat INT,
    idCategorie INT,
    PRIMARY KEY (idPlat, idCategorie),
    FOREIGN KEY (idPlat) REFERENCES Plats(idPlat),
    FOREIGN KEY (idCategorie) REFERENCES Categories(idCategorie)
);

-- =======================
-- INGREDIENTS
-- =======================
CREATE TABLE Ingredients (
    idIngredient INT AUTO_INCREMENT PRIMARY KEY,
    nomIngredient VARCHAR(100),
    imageIngredient VARCHAR(255),
    uniteType VARCHAR(50)
);

-- =======================
-- FOURNISSEURS
-- =======================
CREATE TABLE Fournisseurs (
    idFournisseur INT AUTO_INCREMENT PRIMARY KEY,
    nomFournisseur VARCHAR(100),
    localisation VARCHAR(150),
    contact VARCHAR(150)
);

-- =======================
-- INGREDIENTS_FOURNISSEURS
-- =======================
CREATE TABLE IngredientsFournisseurs (
    idIngredient INT,
    idFournisseur INT,
    prix DECIMAL(10,2),
    PRIMARY KEY (idIngredient, idFournisseur),
    FOREIGN KEY (idIngredient) REFERENCES Ingredients(idIngredient),
    FOREIGN KEY (idFournisseur) REFERENCES Fournisseurs(idFournisseur)
);

-- =======================
-- RECETTES
-- =======================
CREATE TABLE Recettes (
    idRecette INT AUTO_INCREMENT PRIMARY KEY,
    nomRecette VARCHAR(100),
    tempsPrep INT,
    creeA DATETIME,
    idPlat INT,
    FOREIGN KEY (idPlat) REFERENCES Plats(idPlat)
);

-- =======================
-- RECETTES_INGREDIENTS
-- =======================
CREATE TABLE RecettesIngredients (
    idRecette INT,
    idIngredient INT,
    nbrIngredient DECIMAL(10,2),
    unite VARCHAR(50),
    PRIMARY KEY (idRecette, idIngredient),
    FOREIGN KEY (idRecette) REFERENCES Recettes(idRecette),
    FOREIGN KEY (idIngredient) REFERENCES Ingredients(idIngredient)
);

-- =======================
-- ETAPES
-- =======================
CREATE TABLE Etapes (
    idEtape INT AUTO_INCREMENT PRIMARY KEY,
    numeroEtape INT,
    textEtape TEXT,
    idRecette INT,
    FOREIGN KEY (idRecette) REFERENCES Recettes(idRecette)
);

-- =======================
-- NUTRITIONS
-- =======================
CREATE TABLE Nutritions (
    idNutritions INT AUTO_INCREMENT PRIMARY KEY,
    calories INT,
    grasse FLOAT,
    carbs FLOAT,
    fibres FLOAT,
    sucre FLOAT,
    proteines FLOAT,
    idRecette INT,
    FOREIGN KEY (idRecette) REFERENCES Recettes(idRecette)
);

-- =======================
-- UTENSILS
-- =======================
CREATE TABLE Utensils (
    idUtensil INT AUTO_INCREMENT PRIMARY KEY,
    nomUtensile VARCHAR(100),
    imageUtensile VARCHAR(255)
);

-- =======================
-- UTENSILS_RECETTES
-- =======================
CREATE TABLE UtensilsRecettes (
    idUtensil INT,
    idRecette INT,
    PRIMARY KEY (idUtensil, idRecette),
    FOREIGN KEY (idUtensil) REFERENCES Utensils(idUtensil),
    FOREIGN KEY (idRecette) REFERENCES Recettes(idRecette)
);

-- =======================
-- RESTRICTIONS
-- =======================
CREATE TABLE Restrictions (
    idRestriction INT AUTO_INCREMENT PRIMARY KEY,
    nomRestriction VARCHAR(100),
    description TEXT
);

-- =======================
-- RESTRICTIONS_INGREDIENTS
-- =======================
CREATE TABLE RestrictionsIngredients (
    idRestriction INT,
    idIngredient INT,
    PRIMARY KEY (idRestriction, idIngredient),
    FOREIGN KEY (idRestriction) REFERENCES Restrictions(idRestriction),
    FOREIGN KEY (idIngredient) REFERENCES Ingredients(idIngredient)
);

-- =======================
-- STOCK INGREDIENT
-- =======================
CREATE TABLE StockIngredient (
    idIngredient INT PRIMARY KEY,
    quantite DECIMAL(10,2),
    FOREIGN KEY (idIngredient) REFERENCES Ingredients(idIngredient)
);

-- =======================
-- STOCK UTENSILS
-- =======================
CREATE TABLE StockUtensils (
    idUtensil INT PRIMARY KEY,
    quantite INT,
    FOREIGN KEY (idUtensil) REFERENCES Utensils(idUtensil)
);
