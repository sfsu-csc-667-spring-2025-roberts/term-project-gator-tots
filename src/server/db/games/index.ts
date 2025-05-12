import db from "../connection";
import { ADD_PLAYER, CONDITIONALLY_JOIN_SQL, CREATE_SQL } from "./sql";

export const create = async (
  name: string,
  minPlayers: number,
  maxPlayers: number,
  password: string,
  user_id: number,
) => {
  const { id: gameId } = await db.one<{ id: number }>(CREATE_SQL, [
    name,
    minPlayers,
    maxPlayers,
    password,
  ]);

  await db.none(ADD_PLAYER, [gameId, user_id]);
  return gameId;
};

export const join = async (
  userId: number,
  gameId: number,
  password: string = "",
) => {
  const { playerCount } = await db.one<{ playerCount: number }>(
    CONDITIONALLY_JOIN_SQL,
    {
      gameId,
      userId,
      password,
    },
  );

  return playerCount;
};

export default { create, join };
