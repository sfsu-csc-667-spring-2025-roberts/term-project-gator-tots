import db from "../connection";
import bcrypt from "bcrypt";

const register = async (email: string, password: string) => {
  // Encrypt password
  const encryptedPassword = await bcrypt.hash(password, 10);

  const { id } = await db.one(
    "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
    [email, encryptedPassword],
  );
  return id;
};

const login = (email: string, password: string) => {};

export default { register, login };
