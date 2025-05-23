import db from "./connection";

export async function saveChatMessage(
  roomId: number,
  username: string,
  message: string,
) {
  return db.none(
    `INSERT INTO message (user_user_id, game_room_game_room_id, username, message_content, timestamp)
     VALUES (0, $1, $2, $3, NOW())`,
    [roomId, username, message],
  );
}
