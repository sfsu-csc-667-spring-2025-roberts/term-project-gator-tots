export const CREATE_DECK_SQL = `
INSERT INTO deck DEFAULT VALUES RETURNING deck_id`;

export const CREATE_GAME_CARD_PILE_WITH_ID_SQL = `
INSERT INTO game_card_pile (game_card_pile_id) VALUES ($1) RETURNING game_card_pile_id`;

export const CREATE_GAME_ROOM_SQL = `
INSERT INTO game_room (
  game_room_id,
  game_room_host_user_id,
  deck_deck_id,
  game_card_pile_game_card_pile_id,
  game_room_name,
  min_players,
  max_players,
  game_room_password
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING game_room_id`;

export const ADD_PLAYER = `
UPDATE users
SET game_room_id = $1
WHERE user_id = $2
`;

export const CONDITIONALLY_JOIN_SQL = `
UPDATE users
SET game_room_id = $(gameId)
WHERE user_id = $(userId)
  AND (
    SELECT COUNT(*) FROM users WHERE game_room_id = $(gameId)
  ) <= (
    SELECT max_players FROM game_room WHERE game_room_id = $(gameId)
  )
  AND (
    SELECT COUNT(*) FROM users WHERE user_id = $(userId) AND game_room_id IS NULL
  ) = 1
  AND (
  SELECT COUNT(*) FROM game_room
  WHERE game_room_id = $(gameId)
    AND (
      game_room_password IS NULL
      OR game_room_password = $(password)
    )
) = 1
RETURNING (
  SELECT COUNT(*) FROM users WHERE game_room_id = $(gameId)
) AS playerCount
`;
