module.exports = {
  apps: [
    {
      name: "dijet-srapp-backend",
      script: "src/server.js",
      instances: 1,               // single instance (increase to "max" for multi-core when scaling)
      exec_mode: "fork",
      watch: false,               // never watch in production
      max_memory_restart: "500M", // restart if memory exceeds 500MB

      // Auto-restart on crash with exponential backoff
      autorestart: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000,

      // Environment
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },

      // Logs
      out_file: "logs/pm2-out.log",
      error_file: "logs/pm2-error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
