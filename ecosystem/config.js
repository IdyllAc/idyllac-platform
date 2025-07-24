// ecosystem.config.js
module.exports = {
    apps: [
      {
        name: "web-server",
        script: "server.js",
        watch: true,
        autorestart: true,
        env: {
          PORT: 3000
        }
      },
      {
        name: "api-server",
        script: "app.js",
        watch: true,
        autorestart: true,
        env: {
          PORT: 4000
        }
      }
    ]
  }
  