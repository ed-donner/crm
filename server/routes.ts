import { Router, type NextFunction, type Request, type Response } from "express";
import { getDashboard } from "./dashboard.js";
import { type DB } from "./db.js";
import {
  createActivity,
  createContact,
  createDeal,
  createOrganization,
  deleteActivity,
  deleteContact,
  deleteDeal,
  deleteOrganization,
  getContactDetail,
  getDealDetail,
  getOrganizationDetail,
  HttpError,
  listActivities,
  listContacts,
  listDeals,
  listOrganizations,
  setActivityDone,
  updateActivity,
  updateContact,
  updateDeal,
  updateDealStage,
  updateOrganization,
} from "./repositories.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;

function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function parseId(req: Request): number {
  const n = Number(req.params.id);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, "Invalid id");
  return n;
}

export function createRouter(db: DB): Router {
  const router = Router();

  // ---- Organizations ------------------------------------------------------
  router.get("/organizations", (req, res) => {
    res.json(listOrganizations(db, req.query.search as string | undefined));
  });
  router.post("/organizations", asyncHandler((req, res) => {
    res.status(201).json(createOrganization(db, req.body));
  }));
  router.get("/organizations/:id", asyncHandler((req, res) => {
    const org = getOrganizationDetail(db, parseId(req));
    if (!org) throw new HttpError(404, "Organization not found");
    res.json(org);
  }));
  router.put("/organizations/:id", asyncHandler((req, res) => {
    res.json(updateOrganization(db, parseId(req), req.body));
  }));
  router.delete("/organizations/:id", asyncHandler((req, res) => {
    if (!deleteOrganization(db, parseId(req))) throw new HttpError(404, "Organization not found");
    res.status(204).end();
  }));

  // ---- Contacts ----------------------------------------------------------
  router.get("/contacts", (req, res) => {
    res.json(
      listContacts(db, {
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
      }),
    );
  });
  router.post("/contacts", asyncHandler((req, res) => {
    res.status(201).json(createContact(db, req.body));
  }));
  router.get("/contacts/:id", asyncHandler((req, res) => {
    const contact = getContactDetail(db, parseId(req));
    if (!contact) throw new HttpError(404, "Contact not found");
    res.json(contact);
  }));
  router.put("/contacts/:id", asyncHandler((req, res) => {
    res.json(updateContact(db, parseId(req), req.body));
  }));
  router.delete("/contacts/:id", asyncHandler((req, res) => {
    if (!deleteContact(db, parseId(req))) throw new HttpError(404, "Contact not found");
    res.status(204).end();
  }));

  // ---- Deals -------------------------------------------------------------
  router.get("/deals", (req, res) => {
    res.json(listDeals(db, req.query.search as string | undefined));
  });
  router.post("/deals", asyncHandler((req, res) => {
    res.status(201).json(createDeal(db, req.body));
  }));
  router.get("/deals/:id", asyncHandler((req, res) => {
    const deal = getDealDetail(db, parseId(req));
    if (!deal) throw new HttpError(404, "Deal not found");
    res.json(deal);
  }));
  router.put("/deals/:id", asyncHandler((req, res) => {
    res.json(updateDeal(db, parseId(req), req.body));
  }));
  router.patch("/deals/:id/stage", asyncHandler((req, res) => {
    const stage = req.body?.stage as string | undefined;
    if (!stage) throw new HttpError(400, "stage is required");
    res.json(updateDealStage(db, parseId(req), stage));
  }));
  router.delete("/deals/:id", asyncHandler((req, res) => {
    if (!deleteDeal(db, parseId(req))) throw new HttpError(404, "Deal not found");
    res.status(204).end();
  }));

  // ---- Activities --------------------------------------------------------
  router.get("/activities", (req, res) => {
    const contactId = req.query.contact_id ? Number(req.query.contact_id) : undefined;
    const dealId = req.query.deal_id ? Number(req.query.deal_id) : undefined;
    res.json(listActivities(db, { contactId, dealId }));
  });
  router.post("/activities", asyncHandler((req, res) => {
    res.status(201).json(createActivity(db, req.body));
  }));
  router.put("/activities/:id", asyncHandler((req, res) => {
    res.json(updateActivity(db, parseId(req), req.body));
  }));
  router.patch("/activities/:id/done", asyncHandler((req, res) => {
    const done = Boolean(req.body?.done);
    res.json(setActivityDone(db, parseId(req), done));
  }));
  router.delete("/activities/:id", asyncHandler((req, res) => {
    if (!deleteActivity(db, parseId(req))) throw new HttpError(404, "Activity not found");
    res.status(204).end();
  }));

  // ---- Dashboard ---------------------------------------------------------
  router.get("/dashboard", (_req, res) => {
    res.json(getDashboard(db));
  });

  return router;
}
