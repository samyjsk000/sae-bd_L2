import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { restrictions } from "../db/schema.js";
import { asyncHandler, parseId, parsePagination } from "../utils/http.js";

const router = Router();

const buildPayload = (body) => ({
  nomRestriction: body.nomRestriction,
  description: body.description,
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const rows = await db
      .select()
      .from(restrictions)
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
      return res.status(400).json({ message: "Invalid restriction id" });
    }

    const [row] = await db
      .select()
      .from(restrictions)
      .where(eq(restrictions.idRestriction, id));
    if (!row) {
      return res.status(404).json({ message: "Restriction not found" });
    }

    res.json({ data: row });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = buildPayload(req.body);
    if (!payload.nomRestriction) {
      return res.status(400).json({ message: "nomRestriction is required" });
    }

    const [inserted] = await db
      .insert(restrictions)
      .values(payload)
      .$returningId();
    const id = inserted?.idRestriction;
    const [created] = await db
      .select()
      .from(restrictions)
      .where(eq(restrictions.idRestriction, id));

    res.status(201).json({ data: created });
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid restriction id" });
    }

    const [existing] = await db
      .select()
      .from(restrictions)
      .where(eq(restrictions.idRestriction, id));
    if (!existing) {
      return res.status(404).json({ message: "Restriction not found" });
    }

    const payload = buildPayload(req.body);
    await db
      .update(restrictions)
      .set(payload)
      .where(eq(restrictions.idRestriction, id));
    const [updated] = await db
      .select()
      .from(restrictions)
      .where(eq(restrictions.idRestriction, id));

    res.json({ data: updated });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid restriction id" });
    }

    const [existing] = await db
      .select()
      .from(restrictions)
      .where(eq(restrictions.idRestriction, id));
    if (!existing) {
      return res.status(404).json({ message: "Restriction not found" });
    }

    await db.delete(restrictions).where(eq(restrictions.idRestriction, id));
    res.status(204).send();
  }),
);

export default router;
