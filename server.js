require('dotenv').config();  // Ensure this is BEFORE you use process.env.* Always load .env first

console.log('DB HOST:', process.env.DB_HOST);

// ENVIRONMENT CONFIG
const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;
const baseURL = process.env.BASE_URL;
const apiURL = process.env.API_URL;
const renderBase = process.env.RENDER_BASE_URL;

console.log('Running in:', env);
console.log('Base URL:', baseURL);
console.log('API URL:', apiURL);

// CORE MODULES
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// DATABASE & SESSION
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const sequelize = require('./config/database'); // Sequelize (MySQL)

// AUTH & FLASH
const flash = require('express-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const initializePassport = require('./config/passport');

// MODELS
const { User } = require('./models');
const jwtMiddleware = require('./middleware/jwtMiddleware');

// ROUTES
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// INIT APP
const app = express();
app.set('trust proxy', 1); // Render HTTPS support

// PASSPORT INIT
initializePassport(
  passport,
  async email => await User.findOne({ where: { email } }),
  async id => await User.findByPk(id)
);

// VIEW ENGINE SETUP
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// MIDDLEWARE
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));
app.use(flash());
app.use(methodOverride('_method'));

// ✅ PostgreSQL SESSION STORE
const pgPool = new Pool({
  user: process.env.PGUSER || 'your_user',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'your_db',
  password: process.env.PGPASSWORD || 'your_password',
  port: process.env.PGPORT || 5432,
});

app.use(
  session({
    store: new pgSession({ pool: pgPool }),
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env === 'production', // set to true in production
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

// AUTH INIT
app.use(passport.initialize());
app.use(passport.session());

// JWT PROTECTED API ROUTES
app.use('/api', jwtMiddleware);

// ROUTING
app.use('/', publicRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

sequelize.sync(); // For development, or use migrations

// EJS PAGES
app.get('/login', checkNotAuthenticated, (req, res) => res.render('login'));
app.get('/register', checkNotAuthenticated, (req, res) => res.render('register'));
app.get('/dashboard', checkAuthenticated, (req, res) => res.render('dashboard'));
app.get('/profile', checkAuthenticated, (req, res) => res.render('profile'));
app.get('/sittings', checkAuthenticated, (req, res) => res.render('sittings'));
app.get('/submit/personal_info', checkAuthenticated, (req, res) => res.render('personal'));
app.get('/submit/upload/document', checkAuthenticated, (req, res) => res.render('document'));
app.get('/submit/upload/selfie', checkAuthenticated, (req, res) => res.render('selfie'));
app.get('/selfie/success', checkAuthenticated, (req, res) => res.render('success'));

// REGISTER POST
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const { name, email, cemail, password } = req.body;

    if (email !== cemail) {
      return res.status(400).send('Emails do not match.');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationToken = crypto.randomBytes(20).toString('hex');

    await User.create({
      name,
      email,
      password: hashedPassword,
      isConfirmed: false,
      confirmationToken,
    });

    res.redirect('/login');
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.redirect('/register');
  }
});

// LOGIN POST
app.post(
  '/login',
  checkNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true,
  })
);

// LOGOUT
app.delete('/logout', (req, res, next) => {
  req.logOut(err => {
    if (err) return next(err);
    console.log('✅ Logged out');
    res.redirect('/login');
  });
});

// PROTECTED ROUTE HELPERS
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/');
  next();
}

// SEQUELIZE CONNECTION
sequelize
  .authenticate()
  .then(() => console.log('✅ Database connected.'))
  .catch(err => console.error('❌ Database connection error:', err));

sequelize
  .sync()
  .then(() => console.log('✅ All models synced successfully.'))
  .catch(err => console.error('❌ Error syncing models:', err));

// SERVER START
app.listen(port, () => {
  console.log(`🚀 Server running at ${baseURL} on port ${port} (${env} mode)`);
});
