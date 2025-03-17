import express from "express";

const router = express.Router();

router.get("/", (request, response) => {
  const title = "Gator Tot's Game of Bullshit";
  const name = "John";

  response.render("root", { title, name });
});

export default router;
