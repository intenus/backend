import { registerAs } from "@nestjs/config";

interface CorsOptions {
  origin: string;
  methods: string[];
}

export const corsConfig = registerAs('cors', (): CorsOptions => ({
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
}));