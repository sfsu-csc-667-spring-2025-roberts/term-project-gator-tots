import express from "express";

const router = express.Router();

router.get("/", (request, response) => {
  const title = "Jrob's site";
  const name = "John";

  response.render("root", { title, name });
});

export default router;
