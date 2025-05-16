import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // === Create base tables first ===
  pgm.createTable("deck", {
    deck_id: { type: "serial", primaryKey: true },
  });

  pgm.createTable("game_card_pile", {
    game_card_pile_id: { type: "integer", primaryKey: true },
  });

  pgm.createTable("game_room", {
    game_room_id: { type: "integer", primaryKey: true },
    deck_deck_id: { type: "integer", notNull: true },
    game_card_pile_game_card_pile_id: { type: "integer", notNull: true },
    game_room_password: { type: "varchar(45)", default: null },
    game_room_name: { type: "varchar(45)", unique: true },
    game_room_host_user_id: { type: "integer" },
    min_players: { type: "integer" },
    max_players: { type: "integer" },
    game_started: { type: "boolean", default: false },
    game_start_time: { type: "timestamp" },
    current_players_turn: { type: "integer" },
  });

  pgm.createTable("users", {
    user_id: { type: "serial", primaryKey: true },
    username: { type: "varchar(50)", unique: true },
    user_password: { type: "varchar(255)" },
    created_at: { type: "timestamp", default: pgm.func("now()") },
    updated_at: { type: "timestamp", default: pgm.func("now()") },
    game_room_id: { type: "integer" },
  });

  pgm.createTable("card", {
    card_id: { type: "integer", primaryKey: true },
    card_rank: { type: "integer" },
    user_user_id: { type: "integer", notNull: true },
    deck_deck_id: { type: "integer", notNull: true },
    game_card_pile_game_card_pile_id: { type: "integer", notNull: true },
  });

  pgm.createTable("message", {
    message_id: { type: "integer", notNull: true }, // will alter later
    message_content: { type: "varchar(255)" },
    message_time: { type: "timestamp" },
    user_user_id: { type: "integer", notNull: true },
    game_room_game_room_id: {
      type: "integer",
      notNull: true,
      onDelete: "CASCADE",
    },
  });

  // === Add initial constraints ===
  pgm.addConstraint(
    "game_room",
    "fk_game_room_deck_id",
    "FOREIGN KEY(deck_deck_id) REFERENCES deck(deck_id)",
  );

  pgm.addConstraint(
    "game_room",
    "fk_game_room_game_card_pile_id",
    "FOREIGN KEY(game_card_pile_game_card_pile_id) REFERENCES game_card_pile(game_card_pile_id)",
  );

  pgm.addConstraint(
    "card",
    "fk_card_users",
    "FOREIGN KEY(user_user_id) REFERENCES users(user_id)",
  );

  pgm.addConstraint(
    "card",
    "fk_card_deck_id",
    "FOREIGN KEY(deck_deck_id) REFERENCES deck(deck_id)",
  );

  pgm.addConstraint(
    "card",
    "fk_card_game_card_pile_id",
    "FOREIGN KEY(game_card_pile_game_card_pile_id) REFERENCES game_card_pile(game_card_pile_id)",
  );

  pgm.addConstraint(
    "message",
    "fk_message_users",
    "FOREIGN KEY(user_user_id) REFERENCES users(user_id)",
  );

  pgm.addConstraint(
    "message",
    "fk_message_game_room_id",
    "FOREIGN KEY(game_room_game_room_id) REFERENCES game_room(game_room_id) ON DELETE CASCADE",
  );

  // === Add new columns to message ===
  pgm.addColumns("message", {
    username: { type: "varchar(50)", notNull: true },
    timestamp: { type: "timestamp", default: pgm.func("now()"), notNull: true },
  });

  // === Create sequence and set it for message_id ===
  pgm.createSequence("message_message_id_seq");

  pgm.alterColumn("message", "message_id", {
    type: "integer",
    default: pgm.func("nextval('message_message_id_seq')"),
  });

  // === Make message_id the primary key ===
  pgm.addConstraint("message", "pk_message_id", {
    primaryKey: "message_id",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Reverse order matters!

  // Drop message primary key and sequence
  pgm.dropConstraint("message", "pk_message_id");
  pgm.alterColumn("message", "message_id", { default: null });
  pgm.dropSequence("message_message_id_seq");

  // Drop added columns
  pgm.dropColumn("message", "username");
  pgm.dropColumn("message", "timestamp");

  // Drop tables (in reverse of dependencies)
  pgm.dropTable("message");
  pgm.dropTable("card");
  pgm.dropTable("users");
  pgm.dropTable("game_room");
  pgm.dropTable("game_card_pile");
  pgm.dropTable("deck");
}
