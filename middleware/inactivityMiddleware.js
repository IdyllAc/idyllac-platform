// middleware/inactivityMiddleware.js

const MAX_INACTIVITY = 15 * 60 * 1000; // 15 minutes

module.exports = function inactivityMiddleware(req, res, next) {
  try {
    // If user is not authenticated via session, skip inactivity logic
    // Only session-based logged-in users
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return next();
    }

    const now = Date.now();

    // If this is the first request set lastActivity
    if (!req.session.lastActivity) {
      req.session.lastActivity = now;
      return next();
    }

    const inactiveFor = now - req.session.lastActivity;

    // Inactive more than 15 minutes?
    if (inactiveFor > MAX_INACTIVITY) {
      console.log("⏳ Auto-logout: inactive for", inactiveFor / 1000, "seconds");

      // Destroy session & clear cookie
      req.logout(() => {
        req.session.destroy(() => {
          res.clearCookie("connect.sid", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
            path: "/",
          });

          // For API calls, return JSON
          if (req.headers.accept?.includes("application/json")) {
            return res.status(401).json({
              message: "Session expired due to inactivity",
              redirect: "/login",
            });
          }

          return res.redirect("/login");
        });
      });

      return; // stop processing
    }

    // Update last activity time
    req.session.lastActivity = now;
    next();

  } catch (e) {
    console.error("Inactivity middleware error:", e);
    next();
  }
};
