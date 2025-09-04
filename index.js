/***********************
 *  LOAD ENV & CORE
 ***********************/
require('dotenv').config();
console.log('✅ Environment:', process.env.NODE_ENV || 'development');

const express = require('express');
const path = require('path');
const cors = require('cors');
const flash = require('express-flash');
const methodOverride = require('method-override');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const { Pool } = require('pg');
const { sequelize, User } = require('./models');
const initializePassport = require('./config/passport');
const jwtMiddleware = require('./middleware/jwtMiddleware');
const cookieParser = require('cookie-parser');
// const dashboardController = require('./controllers/dashboardController');


/***********************
 *  ROUTES
 ***********************/
const publicRoutes = require('./routes/public');        // EJS pages
const authRoutes = require('./routes/auth');            // JSON API
const userRoutes = require('./routes/user');            // Profile, settings
const subscriptionRoutes = require('./routes/subscription');
const personalRoutes = require('./routes/personal');    // Personal info
const protectRoutes = require('./routes/protect');      // Docs, selfie

/***********************
 *  APP INIT
 ***********************/
const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

/***********************
 *  PASSPORT INIT
 ***********************/
initializePassport(passport);

/***********************
 *  VIEW ENGINE
 ***********************/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/***********************
 *  MIDDLEWARE
 ***********************/
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const store = new pgSession({
  pool: pgPool,
  tableName: 'session',
  createTableIfMissing: true,
});

store.on('error', err => console.error('❌ SESSION STORE ERROR:', err));

// Session setup
app.use(
  session({
    store: new pgSession({
      conObject: {
        connectionString: process.env.DATABASE_URL || "postgres://stidyllac@127.0.0.1/idyllac_db_e081",
        ssl: process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false, // 👈 disable SSL locally
      },
    }),
    secret: process.env.SESSION_SECRET || 'SuperSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(flash());
app.use(methodOverride('_method'));
app.use(cors({ origin: process.env.BASE_URL, credentials: true }));
app.use(cookieParser()); // ✅ parse cookies into req.cookies

app.use(passport.initialize());
app.use(passport.session());

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
 *  ROUTE MOUNTING
 ***********************/
// Public HTML pages (EJS)
app.use('/', publicRoutes); // EJS routes (login, register, static pages)
app.use('/', subscriptionRoutes); // subscription forms

// JSON API
app.use('/api/auth', authRoutes); // API Login/register/logout API
app.use('/api/user', jwtMiddleware, userRoutes); // user API
app.use('/submit/personal', jwtMiddleware, personalRoutes);
app.use('/submit/protect', jwtMiddleware, protectRoutes);
app.use('/dashboard', require('./routes/dashboard')); // dashboard (session protected)

/***********************
 *  SIMPLE PAGE ROUTES
 ***********************/
// Auto language detection for root route
app.get('/', (req, res) => {
  const lang = req.acceptsLanguages('ar', 'en', 'fr') || 'en';

  let fileName;
  switch (lang) {
    case 'ar':
      fileName = 'indexAr.html';
      break;
    case 'fr':
      fileName = 'indexFr.html';
      break;
    case 'en':
    default:
      fileName = 'indexEn.html';
      break;
  }

  res.sendFile(path.join(__dirname, 'public', fileName));
});

// Public static pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/ar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'indexAr.html')));
app.get('/fr', (req, res) => res.sendFile(path.join(__dirname, 'public', 'indexFr.html')));
app.get('/en', (req, res) => res.sendFile(path.join(__dirname, 'puplic', 'indexEn.html')));

// Auth entry pages
app.get('/subscribe', checkNotAuthenticated, (req, res) => res.render('subscribe.html'));
app.get('/subscribeEn', checkNotAuthenticated, (req, res) => res.render('subscribeEn'));
app.get('/subscribeFr', checkNotAuthenticated, (req, res) => res.render('subscribeFr'));
app.get('/login', checkNotAuthenticated, (req, res) => res.render('login'));
app.get('/register', checkNotAuthenticated, (req, res) => res.render('register'));


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
sequelize
  .sync()
  .then(() => console.log('✅ ALL models synced'))
  .catch(err => console.error('❌ Sync error:', err));

sequelize
  .authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ DB connection error:', err));

/***********************
 *  START SERVER
 ***********************/
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
