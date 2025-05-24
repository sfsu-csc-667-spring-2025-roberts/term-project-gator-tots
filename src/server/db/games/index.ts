import db from "../connection";
import {
  ADD_PLAYER,
  AVAILABLE_CARD_COUNT,
  CONDITIONALLY_JOIN_SQL,
  CREATE_DECK_SQL,
  CREATE_GAME_CARD_PILE_WITH_ID_SQL,
  CREATE_GAME_ROOM_SQL,
  GAME_START_SQL,
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
  const result = await db.oneOrNone<{ playerCount: number }>(
    CONDITIONALLY_JOIN_SQL,
    {
      gameId,
      userId,
      password,
      username,
    },
  );

  if (!result) {
    // Handle join failure (e.g., wrong password or other condition)
    const err = new Error("Join failed");
    // @ts-ignore
    err.code = "JOIN_FAILED";
    throw err;
  }

  // Update last_updated column for this user
  await db.none(`UPDATE users SET updated_at = NOW() WHERE user_id = $1`, [
    userId,
  ]);

  return result.playerCount;
};

export const getGameNameById = async (gameId: number) => {
  return db.oneOrNone(
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
     HAVING COUNT(u.user_id) > 0
     ORDER BY gr.game_room_id`,
  );
};

export const isHost = async (user_id: number, gameId: number) => {
  // Adjust column names as needed
  const { host_id } = await db.one(
    "SELECT game_room_host_user_id FROM game_room WHERE game_room_id = $1",
    [gameId],
  );
  return host_id === user_id;
};

export const deleteGame = async (gameId: number) => {
  // Remove all users from the game
  await db.none(
    "UPDATE users SET game_room_id = NULL WHERE game_room_id = $1",
    [gameId],
  );
  // Delete all cards associated with this game's deck
  await db.none(`DELETE FROM card WHERE deck_deck_id = $1`, [gameId]);
  // Delete the game room
  await db.none("DELETE FROM game_room WHERE game_room_id = $1", [gameId]);
};

export const leaveGame = async (user_id: number, gameId: number) => {
  // Delete game_room_id from user to leave game
  await db.none(
    "UPDATE users SET game_room_id = NULL WHERE user_id = $1 AND game_room_id = $2",
    [user_id, gameId],
  );
};

export const getPlayerCount = async (gameId: number) => {
  return db.one(
    "SELECT COUNT(*)::int AS count FROM users WHERE game_room_id = $1",
    [gameId],
  );
};

export const getPlayersInGame = async (gameId: number) => {
  return db.any(
    `SELECT user_id, username, updated_at
     FROM users
     WHERE game_room_id = $1
     ORDER BY updated_at ASC`,
    [gameId],
  );
};

export const getFirstTurnPlayer = async (gameId: number) => {
  return db.one(
    "SELECT user_user_id FROM card c JOIN users u ON u.user_id = c.user_user_id WHERE u.game_room_id = $1 AND c.card_rank = 1",
    [gameId],
  );
};

export const setLastPlayed = async (
  gameId: number,
  userId: number,
  cards: number[],
) => {
  return db.none(
    `UPDATE game_room SET last_played_user_id = $1, last_played_cards = $2 WHERE game_room_id = $3`,
    [userId, cards, gameId],
  );
};

export const getGameInfo = async (gameId: number) => {
  return db.oneOrNone(
    `SELECT min_players, max_players, game_room_name, game_room_password, current_supposed_rank, current_players_turn, game_room_host_user_id
     FROM game_room
     WHERE game_room_id = $1`,
    [gameId],
  );
};

export const getCurrentPlayer = async (gameId: number) => {
  return db.oneOrNone(
    `
    SELECT u.username
    FROM game_room gr
    JOIN users u ON u.user_id = gr.current_players_turn
    WHERE gr.game_room_id = $1
  `,
    [gameId],
  );
};

// In your db/games/index.ts
export const getUserById = async (userId: number) => {
  return db.oneOrNone("SELECT game_room_id FROM users WHERE user_id = $1", [
    userId,
  ]);
};

export const setFirstPlayer = async (gameId: number, userId: number) => {
  await db.none(
    `UPDATE game_room SET current_players_turn = $(userId) WHERE game_room_id = $(gameId)`,
    { gameId, userId },
  );
};

export const getUserCards = async (userId: number, gameId: number) => {
  return db.any(
    "SELECT card_rank FROM card WHERE user_user_id = $1 AND deck_deck_id = $2",
    [userId, gameId],
  );
};

export const start = async (gameId: number) => {
  // Prevent double dealing
  const { count } = await db.one(
    `SELECT COUNT(*)::int AS count FROM card WHERE deck_deck_id = $1`,
    [gameId],
  );
  if (count >= 52) {
    // Cards already dealt, skip dealing
    return;
  }

  await db.none(GAME_START_SQL, { gameId });

  const players = await getPlayersInGame(gameId);

  for (let i = 0; i < players.length; i++) {
    await dealCards(gameId);
  }

  const firstTurnPlayer = await getFirstTurnPlayer(gameId);
  await setFirstPlayer(gameId, firstTurnPlayer.user_user_id);
};

export async function setSupposedRank(gameId: number, rank: number) {
  return db.none(
    `UPDATE game_room SET current_supposed_rank = $1 WHERE game_room_id = $2`,
    [rank, gameId],
  );
}

export async function getSupposedRank(gameId: number) {
  return db.oneOrNone(
    `
    SELECT current_supposed_rank from game_room WHERE game_room_id = $1`,
    [gameId],
  );
}

// Deal the cards
export const dealCards = async (gameId: number) => {
  // 1. Get all unassigned cards for this game
  const available_cards = await db.any(
    `SELECT card_rank FROM card WHERE deck_deck_id = $1 AND user_user_id = 0 AND game_card_pile_game_card_pile_id = 0`,
    [gameId],
  );

  // 2. Shuffle the cards
  function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  const shuffledCards = shuffle(available_cards.map((c) => c.card_rank));

  // 3. Get all players in the game
  const players = await db.any(
    `SELECT user_id FROM users WHERE game_room_id = $1`,
    [gameId],
  );

  // 4. Deal cards round-robin
  const queries = [];
  for (let i = 0; i < shuffledCards.length; i++) {
    const user_id = players[i % players.length].user_id;
    const card_id = shuffledCards[i];
    queries.push(
      db.none(`UPDATE card SET user_user_id = $1 WHERE card_rank = $2`, [
        user_id,
        card_id,
      ]),
    );
  }
  await Promise.all(queries);
};

export async function moveCardsToPile(
  cardRanks: number[],
  game_card_pile_game_card_pile_id: number,
) {
  if (!cardRanks || cardRanks.length === 0) {
    // Nothing to move, just return
    return;
  }
  await db.none(
    `UPDATE card
     SET user_user_id = 0, game_card_pile_game_card_pile_id = $2
     WHERE card_rank = ANY($1)`,
    [cardRanks, game_card_pile_game_card_pile_id],
  );
}

export async function setCurrentPlayerTurn(gameId: number, userId: number) {
  return db.none(
    `UPDATE game_room SET current_players_turn = $1 WHERE game_room_id = $2`,
    [userId, gameId],
  );
}

// Get specific fields from game_room
export const getGameRoomFields = async (gameId: number, fields: string[]) => {
  const fieldList = fields.join(", ");
  return db.one(`SELECT ${fieldList} FROM game_room WHERE game_room_id = $1`, [
    gameId,
  ]);
};

// Get all cards in the pile
export const getPileCards = async (pileId: number) => {
  return db
    .any(
      `SELECT card_rank FROM card WHERE game_card_pile_game_card_pile_id = $1`,
      [pileId],
    )
    .then((cards) => cards.map((c) => Number(c.card_rank)));
};

// Give cards to a user
export const giveCardsToUser = async (userId: number, cardRanks: number[]) => {
  if (cardRanks.length === 0) return;
  return db.none(
    `UPDATE card SET user_user_id = $1, game_card_pile_game_card_pile_id = 0 WHERE card_rank = ANY($2)`,
    [userId, cardRanks],
  );
};

export const setGameFinished = async (gameId: number, winnerId: number) => {
  return db.none(
    `UPDATE game_room SET winner_user_id = $1 WHERE game_room_id = $2`,
    [winnerId, gameId],
  );
};

export default {
  create,
  join,
  getGameNameById,
  isHost,
  deleteGame,
  leaveGame,
  getPlayerCount,
  getPlayersInGame,
  getGameInfo,
  getUserById,
  start,
  dealCards,
  setFirstPlayer,
  getUserCards,
  getCurrentPlayer,
  setSupposedRank,
  getSupposedRank,
  moveCardsToPile,
  setCurrentPlayerTurn,
  setLastPlayed,
  getPileCards,
  giveCardsToUser,
  getGameRoomFields,
  setGameFinished,
};
