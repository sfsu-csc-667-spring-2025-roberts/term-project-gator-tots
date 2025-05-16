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
  host_id: number,
) => {
  // 1. Create deck
  const { deck_id } = await db.one<{ deck_id: number }>(CREATE_DECK_SQL);

  // 2. Create game_card_pile with the same id as deck_id
  await db.one(CREATE_GAME_CARD_PILE_WITH_ID_SQL, [deck_id]);

  // 3. Create game_room using the same id for both deck and pile
  const { game_room_id } = await db.one<{ game_room_id: number }>(
    CREATE_GAME_ROOM_SQL,
    [
      deck_id,
      host_id,
      deck_id,
      deck_id,
      game_name,
      minPlayers,
      maxPlayers,
      password,
    ],
  );

  await db.none(ADD_PLAYER, [game_room_id, host_id]);
  return game_room_id;
};

export const join = async (
  userId: number,
  gameId: number,
  password: string = "",
  username?: string,
) => {
  const { playerCount } = await db.one<{ playerCount: number }>(
    CONDITIONALLY_JOIN_SQL,
    {
      gameId,
      userId,
      password,
      username,
    },
  );

  return playerCount;
};

export const getGameNameById = async (gameId: number) => {
  return db.one(
    "SELECT game_room_name FROM game_room WHERE game_room_id = $1",
    [gameId],
  );
};

export const getAvailableGames = async () => {
  return db.any(
    `SELECT gr.game_room_id, gr.game_room_name, gr.max_players,
            COUNT(u.user_id) AS current_players
     FROM game_room gr
     LEFT JOIN users u ON u.game_room_id = gr.game_room_id
     WHERE gr.game_started = FALSE
       AND gr.game_room_name != 'Lobby'
     GROUP BY gr.game_room_id, gr.game_room_name, gr.max_players
     ORDER BY gr.game_room_id`,
  );
};
// export const isHost = async (user_id: number, gameId: number) => {
//   // Adjust column names as needed
//   const { host_id } = await db.one(
//     "SELECT host_id FROM game_room WHERE game_room_id = $1",
//     [gameId]
//   );
//   return host_id === user_id;
// };

// export const deleteGame = async (gameId: number) => {
//   // Delete related data first if needed (cards, messages, etc.)
//   await db.none("DELETE FROM game_room WHERE game_room_id = $1", [gameId]);
// };

export default { create, join, getGameNameById };
