import db from "../connection";

const register = async (email: string, password: string) => {
  const { id } = await db.one(
    "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
    [email, password],
  );
  return id;
};

const login = () => {};

export default { register, login };
