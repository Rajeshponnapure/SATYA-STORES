// Load local .env values only for the local Node process. Vercel injects its
// environment variables and runs server.ts directly, without dotenv at runtime.
import "dotenv/config";
import "./server";
