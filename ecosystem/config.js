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
    ]
  }
  