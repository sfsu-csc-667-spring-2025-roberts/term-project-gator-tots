import db from "../connection";
import {
  ADD_PLAYER,
  CONDITIONALLY_JOIN_SQL,
  CREATE_DECK_SQL,
  CREATE_GAME_CARD_PILE_WITH_ID_SQL,
  CREATE_GAME_ROOM_SQL,
} from "./sql";

export const create = async (
  game_name: string,
  minPlayers: number,
  maxPlayers: number,
  password: string,
  user_id: number,
) => {
  // 1. Create deck
  const { deck_id } = await db.one<{ deck_id: number }>(CREATE_DECK_SQL);

  // 2. Create game_card_pile with the same id as deck_id
  await db.one(CREATE_GAME_CARD_PILE_WITH_ID_SQL, [deck_id]);

  // 3. Create game_room using the same id for both deck and pile
  const { game_room_id } = await db.one<{ game_room_id: number }>(
    CREATE_GAME_ROOM_SQL,
    [deck_id, deck_id, deck_id, game_name, minPlayers, maxPlayers, password],
  );

  await db.none(ADD_PLAYER, [game_room_id, user_id]);
  return game_room_id;
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

// In src/server/db/games/index.ts
export const getGameNameById = async (gameId: number) => {
  return db.one(
    "SELECT game_room_name FROM game_room WHERE game_room_id = $1",
    [gameId],
  );
};

export default { create, join, getGameNameById };
