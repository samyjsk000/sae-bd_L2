import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { pays } from "../db/schema.js";
import { asyncHandler, parseId, parsePagination } from "../utils/http.js";

const router = Router();

const buildPayload = (body) => ({
  nomPays: body.nomPays,
  drapeuaPays: body.drapeuaPays,
  codePays: body.codePays,
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const rows = await db.select().from(pays).limit(limit).offset(offset);
    res.json({ data: rows, pagination: { limit, offset } });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid country id" });
    }

    const [row] = await db.select().from(pays).where(eq(pays.idPays, id));
    if (!row) {
      return res.status(404).json({ message: "Country not found" });
    }

    res.json({ data: row });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = buildPayload(req.body);
    if (!payload.nomPays) {
      return res.status(400).json({ message: "nomPays is required" });
    }

    const [inserted] = await db.insert(pays).values(payload).$returningId();
    const id = inserted?.idPays;
    const [created] = await db.select().from(pays).where(eq(pays.idPays, id));

    res.status(201).json({ data: created });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid country id" });
    }

    const [existing] = await db.select().from(pays).where(eq(pays.idPays, id));
    if (!existing) {
      return res.status(404).json({ message: "Country not found" });
    }

    const payload = buildPayload(req.body);
    await db.update(pays).set(payload).where(eq(pays.idPays, id));
    const [updated] = await db.select().from(pays).where(eq(pays.idPays, id));

    res.json({ data: updated });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid country id" });
    }

    const [existing] = await db.select().from(pays).where(eq(pays.idPays, id));
    if (!existing) {
      return res.status(404).json({ message: "Country not found" });
    }

    await db.delete(pays).where(eq(pays.idPays, id));
    res.status(204).send();
  }),
);

export default router;
