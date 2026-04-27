module.exports = {
  apps: [
    {
      name: "elizaveta-barokko-bot",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
