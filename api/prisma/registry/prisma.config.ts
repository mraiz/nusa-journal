// Registry database configuration (separate from tenant databases)
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/registry/schema.prisma",
  migrations: {
    path: "prisma/registry/migrations",
  },
  datasource: {
    url: process.env["REGISTRY_DATABASE_URL"] || process.env["DATABASE_URL"],
  },
});
