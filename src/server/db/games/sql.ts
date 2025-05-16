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
INSERT INTO game_users (game_id, user_id)
SELECT $(gameId), $(userId) 
WHERE NOT EXISTS (
  SELECT 'value-doesnt-matter' 
  FROM game_users 
  WHERE game_id=$(gameId) AND user_id=$(userId)
)
AND (
  SELECT COUNT(*) FROM games WHERE id=$(gameId) AND password=$(password)
) = 1
AND (
  (
    SELECT COUNT(*) FROM game_users WHERE game_id=$(gameId)
  ) < (
    SELECT max_players FROM games WHERE id=$(gameId)
  )
)
RETURNING (
  SELECT COUNT(*) AS playerCount FROM game_users WHERE game_id=$(gameId)
)
`;
