import express from "express";
import { Request, Response } from "express";
import User from "../db/users";

const router = express.Router();

// Register
router.get("/register", async (_request: Request, response: Response) => {
  response.render("auth/register");
});

router.post("/register", async (request: Request, response: Response) => {
  console.log("POST /register route hit");
  const { username, password } = request.body;
  // console.log("Username: " + request.body);
  // console.log("Password: " + password);
  try {
    // Create a record in the users table for the user (email, encrypted password)
    const user_id = await User.register(username, password);

    // @ts-ignore
    request.session.user_id = user_id; // store userId in session
    // @ts-ignore
    request.session.username = username;

    // Redirect to lobby after successful registration
    response.redirect("/lobby");
  } catch (error) {
    console.error("Registration error: ", error);
    response.render("auth/register", {
      error: "An error occured when registering.",
    });
  }
});

// Login
router.get("/login", async (_request: Request, response: Response) => {
  response.render("auth/login", { error: null });
});

router.post("/login", async (request: Request, response: Response) => {
  const { username, password } = request.body;

  try {
    const user_id = await User.login(username, password);

    // @ts-ignore
    request.session.user_id = user_id; // store userId in session
    // @ts-ignore
    request.session.username = username;

    response.redirect("/lobby");
  } catch (error) {
    console.error("Login error: ", error);
    response.render("auth/login", { error: "Invalid email or password" });
  }
});

router.get("/logout", async (request: Request, response: Response) => {
  request.session.destroy(() => {
    response.redirect("/");
  });
});

export default router;
