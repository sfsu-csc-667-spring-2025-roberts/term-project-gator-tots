import express from "express";
import { Request, Response } from "express";
import db from "../db/connection";

const router = express.Router();

router.get("/", async (_request: Request, response: Response) => {
  try {
    // Insert a new row into the test_table
    await db.none("INSERT INTO test_table (test_string) VALUES ($1)", [
      `Test string ${new Date().toISOString()}`,
    ]);

    // Fetch all rows from the test_table
    response.json(await db.any("SELECT * FROM test_table"));
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "An error occurred" });
  }
});

export default router;
