import pgPromise from "pg-promise";
import dotenv from "dotenv";

dotenv.config();

const pgp = pgPromise();
const connection = pgp(process.env.DATABASE_URL!);

export default connection;
