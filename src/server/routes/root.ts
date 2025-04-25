import express from "express";

const router = express.Router();

router.get("/", (request, response) => {
  const title = "Gator Tot's Game of Bullshit";

  response.render("root", { title });
});

export default router;
