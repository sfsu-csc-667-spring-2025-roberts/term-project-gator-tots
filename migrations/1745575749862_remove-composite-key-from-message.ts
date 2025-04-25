import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Drop the existing composite primary key
  pgm.dropConstraint("message", "pk_message_composite");

  // Alter the message_id column to make it the primary key
  pgm.addConstraint("message", "pk_message_id", "PRIMARY KEY (message_id)");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Revert the changes by dropping the new primary key
  pgm.dropConstraint("message", "pk_message_id");

  // Re-add the composite primary key
  pgm.addConstraint(
    "message",
    "pk_message_composite",
    "PRIMARY KEY (message_id, game_room_game_room_id)",
  );
}
