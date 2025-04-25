import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add the 'username' column
  pgm.addColumn("message", {
    username: { type: "varchar(50)", notNull: true },
  });

  // Add the 'timestamp' column with a default value
  pgm.addColumn("message", {
    timestamp: { type: "timestamp", default: pgm.func("now()"), notNull: true },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remove the 'username' column
  pgm.dropColumn("message", "username");

  // Remove the 'timestamp' column
  pgm.dropColumn("message", "timestamp");
}
