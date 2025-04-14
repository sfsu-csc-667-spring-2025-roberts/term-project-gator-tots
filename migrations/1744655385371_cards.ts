import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("cards", {
    id: "id",
    value: {
      type: "integer",
      notNull: true,
    },
  });

  pgm.sql("INSERT INTO cards (id, value)");
}

export async function down(pgm: MigrationBuilder): Promise<void> {}
