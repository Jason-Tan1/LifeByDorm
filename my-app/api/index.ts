// Vercel Serverless Function Entrypoint
// This bridges the Vercel API environment to your Express app
// Vercel requires explicit .js extensions for ESM imports in built output
import app from '../server/server.js';

export default app;
