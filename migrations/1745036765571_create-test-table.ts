import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET search_path to "GatorTotsDb"`);

  pgm.createTable("test_table", {
    id: "id",
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
    test_string: {
      type: "varchar(1000)",
      notNull: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`SET search_path to "GatorTotsDb"`);
  pgm.dropTable("test_table", { cascade: true });
}
