import db from "../connection";
import bcrypt from "bcrypt";

export type User = {
  user_id: number;
  username: string;
  user_password: string;
};

const register = async (username: string, password: string) => {
  // Encrypt password
  const encryptedPassword = await bcrypt.hash(password, 10);

  const { user_id } = await db.one(
    'INSERT INTO "GatorTotsDb"."users" (username, user_password) VALUES ($1, $2) RETURNING user_id',
    [username, encryptedPassword],
  );
  console.log(user_id);
  return user_id;
};

const login = async (username: string, password: string) => {
  const user = await db.one<User>(
    'SELECT * FROM "GatorTotsDb"."users" WHERE username = $1',
    [username],
  );

  const passwordsMatch = await bcrypt.compare(password, user.user_password);

  if (passwordsMatch) {
    return user.user_id;
  } else {
    throw new Error("Failed to login");
  }
};

export default { register, login };
