import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Drop the existing primary key constraint
  pgm.dropConstraint("message", "pk_message_composite");

  // Create a sequence for the message_id column
  pgm.createSequence("message_message_id_seq");

  // Alter the message_id column to use the sequence as the default value
  pgm.alterColumn("message", "message_id", {
    type: "integer",
    default: pgm.func("nextval('message_message_id_seq')"),
  });

  // Re-add the primary key constraint
  pgm.addConstraint("message", "pk_message_id", "PRIMARY KEY (message_id)");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Revert the changes
  pgm.dropConstraint("message", "pk_message_id");

  // Remove the default value for the message_id column
  pgm.alterColumn("message", "message_id", { default: null });

  // Drop the sequence
  pgm.dropSequence("message_message_id_seq");

  // Re-add the composite primary key
  pgm.addConstraint(
    "message",
    "pk_message_composite",
    "PRIMARY KEY (message_id, game_room_game_room_id)",
  );
}
