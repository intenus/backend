import { registerAs } from "@nestjs/config";
import { DataSourceOptions } from "typeorm";

export const databaseConfig = registerAs('database', (): DataSourceOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'intenus',
  schema: process.env.DATABASE_SCHEMA,
  synchronize: (process.env.DATABASE_SYNCHRONIZE || 'false') === 'true',
  logging: (process.env.DATABASE_LOGGING || 'false') === 'true',
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
}));
