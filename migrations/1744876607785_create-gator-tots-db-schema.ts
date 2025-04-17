import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createSchema("GatorTotsDb");
  pgm.sql('SET search_path TO "GatorTotsDb"');

  pgm.createTable(
    { schema: "GatorTotsDb", name: "deck" },
    {
      deck_id: { type: "integer", primaryKey: true },
    },
  );

  pgm.createTable(
    { schema: "GatorTotsDb", name: "game_card_pile" },
    {
      game_card_pile_id: { type: "integer", primaryKey: true },
    },
  );

  pgm.createTable(
    { schema: "GatorTotsDb", name: "game_room" },
    {
      game_room_id: { type: "integer", primaryKey: true },
      deck_deck_id: { type: "integer", notNull: true },
      game_card_pile_game_card_pile_id: { type: "integer", notNull: true },
      game_room_password: { type: "varchar(45)" },
      game_room_name: { type: "varchar(45)", unique: true },
      min_players: { type: "integer" },
      max_players: { type: "integer" },
      game_started: { type: "boolean", default: false },
      game_start_time: { type: "timestamp" },
      current_players_turn: { type: "integer" },
    },
  );

  pgm.addConstraint(
    { schema: "GatorTotsDb", name: "game_room" },
    "game_room",
    "FOREIGN KEY(deck_deck_id) REFERENCES deck(deck_id)",
  );
  pgm.addConstraint(
    { schema: "GatorTotsDb", name: "game_room" },
    "game_room",
    "FOREIGN KEY(game_card_pile_game_card_pile_id) REFERENCES game_card_pile(game_card_pile_id)",
  );

  pgm.createTable(
    { schema: "GatorTotsDb", name: "user" },
    {
      user_id: { type: "serial", primaryKey: true },
      username: { type: "varchar(50)", unique: true },
      user_password: { type: "varchar(30)" },
      created_at: { type: "timestamp", default: pgm.func("now()") },
      updated_at: { type: "timestamp", default: pgm.func("now()") },
      game_room_id: { type: "integer" },
      game_room_game_room_id: { type: "integer", notNull: true },
    },
  );

  pgm.addConstraint(
    { schema: "GatorTotsDb", name: "user" },
    "user",
    "FOREIGN KEY(game_room_game_room_id) REFERENCES game_room(game_room_id)",
  );

  pgm.createTable(
    { schema: "GatorTotsDb", name: "card" },
    {
      card_id: { type: "integer", primaryKey: true },
      card_rank: { type: "integer" },
      user_user_id: { type: "integer", notNull: true },
      deck_deck_id: { type: "integer", notNull: true },
      game_card_pile_game_card_pile_id: { type: "integer", notNull: true },
    },
  );

  pgm.addConstraint(
    { schema: "GatorTotsDb", name: "card" },
    "card",
    'FOREIGN KEY(user_user_id) REFERENCES "user"(user_id)',
  );
  pgm.addConstraint(
    { schema: "GatorTotsDb", name: "card" },
    "card",
    "FOREIGN KEY(deck_deck_id) REFERENCES deck(deck_id)",
  );
  pgm.addConstraint(
    { schema: "GatorTotsDb", name: "card" },
    "card",
    "FOREIGN KEY(game_card_pile_game_card_pile_id) REFERENCES game_card_pile(game_card_pile_id)",
  );

  pgm.createTable(
    { schema: "GatorTotsDb", name: "message" },
    {
      message_id: { type: "integer", notNull: true },
      message_content: { type: "varchar(255)" },
      message_time: { type: "timestamp" },
      user_user_id: { type: "integer", notNull: true },
      game_room_game_room_id: { type: "integer", notNull: true },
    },
  );

  pgm.addConstraint(
    { schema: "GatorTotsDb", name: "message" },
    "message",
    "PRIMARY KEY (message_id, game_room_game_room_id)",
  );

  pgm.addConstraint(
    { schema: "GatorTotsDb", name: "message" },
    "message",
    'FOREIGN KEY(user_user_id) REFERENCES "user"(user_id)',
  );
  pgm.addConstraint(
    { schema: "GatorTotsDb", name: "message" },
    "message",
    "FOREIGN KEY(game_room_game_room_id) REFERENCES game_room(game_room_id)",
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropSchema("GatorTotsDb", { cascade: true });
}
