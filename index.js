/***********************
 *  LOAD ENV & CORE
 ***********************/
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
  require('dotenv').config({ path: envFile });
  console.log(`🌍 Running in ${process.env.NODE_ENV} mode using ${envFile}`);

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const pgSession = require('connect-pg-simple')(session);
const flash = require('connect-flash');
const { Pool } = require('pg');
const { sequelize} = require('./models');
const initializePassport = require('./config/passport');
const jwtMiddleware = require('./middleware/jwtMiddleware');
const combinedAuth = require('./middleware/combinedAuth');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const inactivityMiddleware = require("./middleware/inactivityMiddleware");

/***********************
 *  ROUTES
 ***********************/
const publicRoutes = require('./routes/public');        // EJS pages
const authRoutes = require('./routes/auth');            // JSON API
const userRoutes = require('./routes/user');            // Profile, settings
const subscribeRoutes = require('./routes/subscribe');
const messageRoutes = require('./routes/message');
const protectRoutes = require('./routes/protect');      // Docs, selfie
const profileRoutes = require('./routes/profile');
const dashboardRoutes = require('./routes/dashboard');
const socialAuthRoutes = require('./routes/authSocial');


/***********************
 *  APP INIT
 ***********************/
const app = express();
const PORT = process.env.PORT || 3000;

// Enable trust proxy ONLY in production (needed if you’re behind Nginx/Render/Heroku/Cloudflare)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}


// // Ensure upload directories exist
// const uploadDirs = [
//   path.join(__dirname, 'uploads'),
//   path.join(__dirname, 'uploads', 'profile_photos'),
//   // add other upload subfolders here if needed, e.g.
//   // path.join(__dirname, 'uploads', 'documents'),
//   // path.join(__dirname, 'uploads', 'selfies')
// ];

// uploadDirs.forEach(dir => {
//   try {
//     if (!fs.existsSync(dir)) {
// fs.mkdirSync(dir, { recursive: true });
// console.log(`✔ Created upload folder: ${dir}`);
// } else {
//   console.log(`ℹ️ Upload folder exists: ${dir}`);
// }
// } catch (err) {
// console.error(`❌ Failed to ensure folder ${dir}:`, err);
// // optional: process.exit(1) if you want startup to fail hard
// }
// });


// ensure and serve
['uploads', path.join('uploads','profile_photos')].forEach(dir => {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});


/***********************
 *  PASSPORT INIT
 ***********************/
// Initialize all strategies (local + social)
initializePassport(passport);

/***********************
 *  VIEW ENGINE
 ***********************/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



/***********************
 *  MIDDLEWARE, SECURITY + STATIC FILES
 ***********************/
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // only if you have inline <style>
      imgSrc: ["'self'", "data:"], // allow base64 images (e.g. selfie preview)
      connectSrc: ["'self'"], // allow fetch() to same origin
    },
  })
);


/***********************
 *  SESSION STORE
 ***********************/
let pgPool;

if (process.env.NODE_ENV === 'production') {
  // Render/Postgres in production
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  // Local development DB
  pgPool = new Pool({
    user: process.env.DB_USER || "stidyllac",
    password: process.env.DB_PASSWORD || null,
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "idyllac_db_e081",
    ssl: false, // explicitly off in dev
  });
}

const store = new pgSession({
  pool: pgPool,
  tableName: "session",
  createTableIfMissing: true,  // ✅ auto-create table if missing in dev but not prod (ensure it exists in prod) and should run a migration instead of auto-creating.
});

/***********************
 *  CORE MIDDLEWARES
 ***********************/
app.use(cookieParser()); // ✅ parse cookies into req.cookies

// ✅ Using the store defined above with session middleware plug into Express
app.use(require('express-session')({
    store, // <-- your configured store (MySQL, Redis, PostgreSQL, etc.)
    secret: process.env.SESSION_SECRET || "super-secret-key", // 🔑 required
    resave: false,             // recommended
    saveUninitialized: false,  // recommended
    rolling: true, // 🔄 refresh cookie expiration on each request
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day (in ms)
      secure: process.env.NODE_ENV === "production", // ✅ cookie only over HTTPS in prod on different domains this become true
      httpOnly: true, // JS can’t touch cookies
      sameSite: process.env.NODE_ENV === "production" ? "None" : "lax", // 'None' for cross-site in prod (with HTTPS), 'lax' in dev
      // path: '/', // cookie valid for entire site
    },
  }));

// 3️⃣ Passport (after session)
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(methodOverride('_method'));

// Apply before your protected routes
app.use(inactivityMiddleware);

/***********************
 *  GLOBAL LOCALS
 ***********************/
// 👇 make req.user available to all EJS templates
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Make flash messages available in all templates
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

/***********************
 *  CORS
 ***********************/
app.use(cors({
  origin: [
    process.env.BASE_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
}));

/***********************
 *  SESSION HELPERS
 ***********************/
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  next();
}

/***********************
 *  SIMPLE PAGE ROUTES
 ***********************/
// Auto language detection for root route
app.get('/', (req, res) => {
  const lang = req.acceptsLanguages('ar', 'en', 'fr') || 'en';
  const fileMap = { ar: 'indexAr.html', fr: 'indexFr.html', en: 'indexEn.html' };

  // let fileName;
  // switch (lang) {
  //   case 'ar':
  //     fileName = 'indexAr.html';
  //     break;
  //   case 'fr':
  //     fileName = 'indexFr.html';
  //     break;
  //   case 'en':
  //   default:
  //     fileName = 'indexEn.html';
  //     break;
  // }

  res.sendFile(path.join(__dirname, 'public', fileMap[lang] || 'indexEn.html'));
});

// Public static pages
app.get('/default', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/ar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'indexAr.html')));
app.get('/fr', (req, res) => res.sendFile(path.join(__dirname, 'public', 'indexFr.html')));
app.get('/en', (req, res) => res.sendFile(path.join(__dirname, 'public', 'indexEn.html')));
app.get('/subscribeAr', (req, res) => res.sendFile(path.join(__dirname, 'public', 'subscribeAr.html')));
app.get('/subscribeEn', (req, res) => res.sendFile(path.join(__dirname,  'public', 'subscribeEn.html')));
app.get('/subscribeFr', (req, res) => res.sendFile(path.join(__dirname, 'public', 'subscribeFr.html')));
app.get('/local', (req, res) => res.sendFile(path.join(__dirname, 'public', 'local.html')));
app.get('/international', (req, res) => res.sendFile(path.join(__dirname, 'public', 'international.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/hours', (req, res) => res.sendFile(path.join(__dirname, 'public', 'hours.html')));

// Auth entry pages
app.get('/login', checkNotAuthenticated, (req, res) => res.render('login'));
app.get('/register', checkNotAuthenticated, (req, res) => res.render('register'));


/***********************
 *  ROUTE MOUNTING
 ***********************/
// Public HTML pages (EJS)
app.use('/', publicRoutes); // EJS routes (login, register, static pages)
app.use('/subscribe', subscribeRoutes); // subscription forms (email/social)
app.use('/auth', socialAuthRoutes);
app.use('/message', messageRoutes); // contact/message forms 


// JSON API
app.use('/api/auth', authRoutes); // API Login/register/logout API
app.use('/api/user', jwtMiddleware, userRoutes); // user API
app.use('/', dashboardRoutes); // dashboard (session protected)
app.use('/protect', combinedAuth, protectRoutes);
app.use('/profile', combinedAuth, profileRoutes); // or app.use('/api', profileRoutes) depending on your structure



/***********************
 *  ERROR HANDLER
 ***********************/
app.use((err, req, res, next) => {
  console.error('💥 Uncaught error:', err.stack);
  res.status(500).send('Something went wrong!');
});

/***********************
 *  DATABASE CONNECT
 ***********************/
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ DB connection error:', err));

sequelize.sync()
  .then(() => console.log('✅ ALL models synced'))
  .catch(err => console.error('❌ Sync error:', err));

/***********************
 *  START SERVER
 ***********************/
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
