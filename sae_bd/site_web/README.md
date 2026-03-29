# Recipe Manager API (Express + Drizzle + MySQL)

This project provides a complete local API for your `cooking_db` schema.
It includes essential CRUD endpoints plus relation endpoints for recipes, ingredients, menus, steps, nutrition, and utensils.

## 1. Requirements

- Node.js 20+
- MySQL 8+
- Existing database created from SQL script (`GroupeC-script-creation.sql`)

## 2. Setup

```bash
npm install
cp .env.example .env
```

Update `.env` values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cooking_db
NODE_ENV=development
```

Run API:

```bash
npm run dev
```

Initialize / update schema and add demo data:

```bash
npm run db:push
npm run db:seed
```

Health check:

- `GET /health`

Base API path:

- `/api`

UI:

- `http://localhost:3000/` (browse, create, delete recipes, ingredients, menus)

## 3. Web UI

A simple vanilla HTML/CSS/JS interface is included at `public/index.html` and served automatically when you run the API.

**Features:**

- View and create ingredients with stock tracking
- Browse and search recipes
- View full recipe details (ingredients, steps, nutrition)
- Create and manage menus
- Quick stats dashboard

**Access:**

Open your browser to `http://localhost:3000/` after starting the API.

## 4. Essential Endpoints

Pagination on list endpoints:

- `?limit=<number>` defaults to 25, max 100
- `?offset=<number>` defaults to 0

### Countries (`/api/pays`)

- `GET /api/pays`
- `GET /api/pays/:id`
- `POST /api/pays`
- `PUT /api/pays/:id`
- `DELETE /api/pays/:id`

### Cuisines (`/api/cuisines`)

- `GET /api/cuisines`
- `GET /api/cuisines/:id`
- `POST /api/cuisines`
- `PUT /api/cuisines/:id`
- `DELETE /api/cuisines/:id`

### Ingredients (`/api/ingredients`)

- `GET /api/ingredients`
- `GET /api/ingredients?q=tomate`
- `GET /api/ingredients/:id`
- `POST /api/ingredients`
- `PUT /api/ingredients/:id`
- `PUT /api/ingredients/:id/stock`
- `DELETE /api/ingredients/:id`

### Dishes / Plats (`/api/plats`)

- `GET /api/plats`
- `GET /api/plats?q=pasta`
- `GET /api/plats/:id`
- `GET /api/plats/:id/recettes`
- `POST /api/plats`
- `PUT /api/plats/:id`
- `POST /api/plats/:id/categories/:categorieId`
- `DELETE /api/plats/:id`

### Recipes (`/api/recettes`)

- `GET /api/recettes`
- `GET /api/recettes?q=carbonara`
- `GET /api/recettes/:id`
- `GET /api/recettes/:id/full`
- `POST /api/recettes`
- `PUT /api/recettes/:id`
- `DELETE /api/recettes/:id`

Recipe relations:

- `POST /api/recettes/:id/ingredients`
- `DELETE /api/recettes/:id/ingredients/:ingredientId`
- `POST /api/recettes/:id/etapes`
- `PUT /api/recettes/:id/nutrition`
- `POST /api/recettes/:id/utensils/:utensilId`
- `DELETE /api/recettes/:id/utensils/:utensilId`

### Menus (`/api/menus`)

- `GET /api/menus`
- `GET /api/menus/:id`
- `POST /api/menus`
- `PUT /api/menus/:id`
- `DELETE /api/menus/:id`

Menu relations:

- `GET /api/menus/:id/plats`
- `POST /api/menus/:id/plats/:platId`
- `DELETE /api/menus/:id/plats/:platId`

## 5. Request Examples

Create ingredient:

```bash
curl -X POST http://localhost:3000/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "nomIngredient": "Tomato",
    "imageIngredient": "https://example.com/tomato.jpg",
    "uniteType": "g"
  }'
```

Create recipe:

```bash
curl -X POST http://localhost:3000/api/recettes \
  -H "Content-Type: application/json" \
  -d '{
    "nomRecette": "Pasta Sauce",
    "tempsPrep": 25,
    "idPlat": 1
  }'
```

Attach ingredient to recipe:

```bash
curl -X POST http://localhost:3000/api/recettes/1/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "idIngredient": 3,
    "nbrIngredient": 250,
    "unite": "g"
  }'
```

## 6. Notes

- The API is ready for manual inserts and future scraper-driven bulk inserts.
- Column names in Drizzle match your SQL script exactly (including original spelling such as `drapeuaPays` and `imageCusine`).
- `limit` and `offset` query params are supported on list endpoints.

## 7. Small API Cheatsheet

Base URL:

- `http://localhost:3000`

Useful quick checks:

- `GET /health`
- `GET /api/ingredients?q=tom`
- `GET /api/plats/:id/recettes`
- `GET /api/recettes/:id/full`
- `GET /api/menus/:id/plats`

Common write examples:

1. Create a country

```bash
curl -X POST http://localhost:3000/api/pays \
  -H "Content-Type: application/json" \
  -d '{"nomPays":"Spain","drapeuaPays":"https://flagcdn.com/es.svg","codePays":"ES"}'
```

2. Create a dish

```bash
curl -X POST http://localhost:3000/api/plats \
  -H "Content-Type: application/json" \
  -d '{"nomPlat":"Tortilla","description":"Classic spanish omelette","idCuisine":1}'
```

3. Create a recipe and attach an ingredient

```bash
curl -X POST http://localhost:3000/api/recettes \
  -H "Content-Type: application/json" \
  -d '{"nomRecette":"Tortilla simple","tempsPrep":25,"idPlat":1}'

curl -X POST http://localhost:3000/api/recettes/1/ingredients \
  -H "Content-Type: application/json" \
  -d '{"idIngredient":1,"nbrIngredient":300,"unite":"g"}'
```

## 8. Seeding Data

Command:

```bash
npm run db:seed
```

What it inserts (idempotent, safe to run multiple times):

- Countries: France, Italie
- Cuisines: Cuisine Francaise, Cuisine Italienne
- Categories: Plat principal, Vegetarien
- Ingredients + stock: Tomate, Basilic, Pates, Huile d'olive
- Suppliers + prices for selected ingredient/supplier pairs
- Dishes: Pasta Pomodoro, Ratatouille Maison
- Recipe: Pasta Pomodoro Rapide
- Recipe links: ingredients, steps, nutrition, utensils
- Menu: Menu Semaine with 2 plats

## 9. Postman Quick Start

Collection file:

- `postman/Recipe-Manager-API.postman_collection.json`

How to use:

1. Open Postman and import the collection JSON file.
2. Set `baseUrl` to your API URL (default: `http://localhost:3000`).
3. Run `GET /health`, then list endpoints (`/api/ingredients`, `/api/recettes`, `/api/menus`).
4. Update IDs in variables (`recipeId`, `platId`, `menuId`, `ingredientId`) if your local data differs.
