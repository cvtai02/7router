// pm2 process definition for the 7router API.
//
//   pm2 start ecosystem.config.js
//   pm2 save                       # persist across reboots (after `pm2 startup`)
//
// Keep instances at 1 / fork mode. main.ts does `import "dotenv/config"`, so the
// process loads app/.env (SYSTEM_SECRET, ENCRYPTION_KEY, DATABASE_URL) on its own
// as long as cwd is app/. Secrets stay in .env, never in this committed file.
module.exports = {
  apps: [
    {
      name: "7router-api",
      cwd: __dirname, // run from app/ so dist/main.js and .env resolve
      script: "dist/main.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "20131",
      },
    },
  ],
};
