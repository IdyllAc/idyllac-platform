// ecosystem.config.js
module.exports = {
    apps: [
      {
        name: "web-server",
        script: "index.js",
        watch: true,
        autorestart: true,
        env: {
          PORT: 3000
        }
      },
    ]
  }
  