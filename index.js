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
initializePassport(
  passport,
  async email => await User.findOne({ where: { email } }),
  async id => await User.findByPk(id)
);

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

app.use(
  session({
    store,
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
app.use('/', publicRoutes);
app.use('/', subscriptionRoutes);

// JSON API
app.use('/api/auth', authRoutes); // Login/register/logout API
app.use('/api/user', jwtMiddleware, userRoutes);
app.use('/submit/personal', jwtMiddleware, personalRoutes);
app.use('/submit/protect', jwtMiddleware, protectRoutes);

/***********************
 *  SIMPLE PAGE ROUTES
 ***********************/
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/indexAr', (req, res) => res.sendFile(path.join(__dirname, 'public', 'indexAr.html')));
app.get('/indexEn', (req, res) => res.sendFile(path.join(__dirname, 'puplic', 'indexEn.html')));
app.get('/indexFr', (req, res) => res.sendFile(path.join(__dirname, 'public', 'indexFr.html')));
app.get('/subscribe', checkNotAuthenticated, (req, res) => res.render('subscribe.html'));
// app.get('/subscribeEn', checkNotAuthenticated, (req, res) => res.render('subscribeEn'));
// app.get('/subscribeFr', checkNotAuthenticated, (req, res) => res.render('subscribeFr'));
app.get('/login', checkNotAuthenticated, (req, res) => res.render('login'));
app.get('/register', checkNotAuthenticated, (req, res) => res.render('register'));
app.get('/dashboard', checkAuthenticated, (req, res) => res.render('dashboard'));
app.get('/profile', checkAuthenticated, (req, res) => res.render('profile'));
app.get('/settings', checkAuthenticated, (req, res) => res.render('settings'));
app.get('/submit/personal_info', checkAuthenticated, (req, res) => res.render('personal'));
app.get('/submit/upload/document', checkAuthenticated, (req, res) => res.render('document'));
app.get('/submit/upload/selfie', checkAuthenticated, (req, res) => res.render('selfie'));
app.get('/selfie/success', checkAuthenticated, (req, res) => res.render('success'));

/***********************
 *  LOGIN / LOGOUT (SESSION)
 ***********************/
app.post(
  '/login',
  checkNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true,
  })
);

app.delete('/logout', (req, res, next) => {
  req.logOut(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

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
