import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Insert a default deck
  pgm.sql(`
    INSERT INTO deck (deck_id)
    VALUES (0)
    ON CONFLICT (deck_id) DO NOTHING;
  `);

  // Insert a default game card pile
  pgm.sql(`
    INSERT INTO game_card_pile (game_card_pile_id)
    VALUES (0)
    ON CONFLICT (game_card_pile_id) DO NOTHING;
  `);

  // Insert the lobby into the game_room table
  pgm.sql(`
    INSERT INTO game_room (
      game_room_id,
      deck_deck_id,
      game_card_pile_game_card_pile_id,
      game_room_password,
      game_room_name,
      min_players,
      max_players,
      game_started,
      game_start_time,
      current_players_turn
    ) VALUES (
      0, 0, 0, NULL, 'Lobby', 0, 0, false, NULL, NULL
    )
    ON CONFLICT (game_room_id) DO NOTHING;
  `);

  // Set the sequence to start at 1 (so next insert is 1)
  pgm.sql(
    `SELECT setval(pg_get_serial_sequence('game_room', 'game_room_id'), 1, false);`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Delete the lobby from the game_room table
  pgm.sql(`DELETE FROM game_room WHERE game_room_id = 0;`);

  // Delete the default game card pile
  pgm.sql(`DELETE FROM game_card_pile WHERE game_card_pile_id = 0;`);

  // Delete the default deck
  pgm.sql(`DELETE FROM deck WHERE deck_id = 0;`);
}
