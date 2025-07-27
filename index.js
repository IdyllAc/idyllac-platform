/***********************
 *  LOAD ENV VARIABLES
 ***********************/
require('dotenv').config();
console.log('✅ Environment:', process.env.NODE_ENV || 'development');

/***********************
 *  CORE MODULES
 ***********************/
const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const flash = require('express-flash');
const methodOverride = require('method-override');
const cors = require('cors');

/***********************
 *  DATABASE & SESSION
 ***********************/
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { sequelize, User } = require('./models'); // Sequelize models
const { Pool } = require('pg');

/***********************
 *  PASSPORT (SESSION AUTH)
 ***********************/
const passport = require('passport');
const initializePassport = require('./config/passport');

/***********************
 *  JWT MIDDLEWARE
 ***********************/
const jwtMiddleware = require('./middleware/jwtMiddleware');

/***********************
 *  ROUTES
 ***********************/
const publicRoutes = require('./routes/public');        // Public EJS pages
const authRoutes = require('./routes/auth');            // Session + JWT auth
const userRoutes = require('./routes/user');            // Profile, settings
const subscriptionRoutes = require('./routes/subscription');
const personalRoutes = require('./routes/personal');    // Personal info
const protectRoutes = require('./routes/protect');      // Documents, selfie
const { FORCE } = require('sequelize/lib/index-hints');

/***********************
 *  EXPRESS APP INIT
 ***********************/
const app = express();
const PORT = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';
app.set('trust proxy', 1); // Required for HTTPS on Render

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
// ✅ Parse JSON and forms first
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

// // ✅ FIX: Proper session setup
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || 'SuperSecretKey', // ✅ REQUIRED
//     resave: false, // don't save session if unmodified
//     saveUninitialized: false, // don't create session until something stored
//     cookie: {
//       secure: process.env.NODE_ENV === 'production', // true if using HTTPS
//       httpOnly: true,
//       maxAge: 1000 * 60 * 60, // 1 hour
//     },
//   })
// );


/***********************
 *  SESSION STORE
 ***********************/
// ✅ Setup PostgreSQL pool for session store
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL, // ✅ Render provides this
  ssl: {
    rejectUnauthorized: false, // Required for Render hosted Postgres
  },
});

// ✅ Session store (correct, no duplicate session middleware)
const store = new pgSession({
  pool: pgPool,
  tableName: 'session',
  createTableIfMissing: true, // Auto-create if missing
});

// ✅ Handle session store errors
store.on('error', (err) => {
  console.error('❌ SESSION STORE ERROR:', err);
});


// const pgPool = new Pool({
//   user: process.env.PGUSER,
//   host: process.env.PGHOST,
//   database: process.env.PGDATABASE,
//   password: process.env.PGPASSWORD,
//   port: process.env.PGPORT || 5432,
// });


app.use(
  session({
    store,
    secret: process.env.SESSION_SECRET || 'SuperSecretKey', // ✅ REQUIRED for signing the session ID cookie
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in production
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

 // ✅ Flash, Method Override, CORS (AFTER session)if use flash messages
app.use(flash());
app.use(methodOverride('_method'));
app.use(cors({ origin: process.env.BASE_URL, credentials: true }));

/***********************
 *  PASSPORT SESSION
 ***********************/
app.use(passport.initialize());
app.use(passport.session());

/***********************
 *  SESSION-BASED ROUTES (EJS PAGES)
 ***********************/
app.use('/', publicRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/', subscriptionRoutes);

app.get('/', (req, res) => res.render('index'));
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
 *  AUTH ROUTES (SESSION)
 ***********************/
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
  
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        isConfirmed: false,
        confirmationToken,
      });

      console.log('✅ New user registered to DB:', newUser.id, newUser.email);
  
      res.redirect('/login'); 
    } catch (err) {
      console.error('❌ Registration error:', err);
      res.redirect('/register');
    }
  });

  
  // LOGIN POST
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
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

  /***********************
 *  HELPER MIDDLEWARE
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
 *  JWT-PROTECTED API ROUTES
 ***********************/
app.use('/submit', jwtMiddleware, personalRoutes);
app.use('/submit', jwtMiddleware, protectRoutes);
app.use('/api/user', jwtMiddleware, userRoutes);

/***********************
 *  ERROR HANDLER
 ***********************/
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  res.status(500).send('Something went wrong!');
});

/***********************
 *  DATABASE CONNECTION
 ***********************/
sequelize
  .sync() // Use alter: true for development, or use migrations in production
  .then(() => console.log('✅ ALL models synced successfully'))
  .catch(err => console.error('❌ Error syncing models:', err));

sequelize
  .authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection error:', err));

  app.get('/test-session', (req, res) => {
    if (!req.session.views) {
      req.session.views = 1;
    } else {
      req.session.views++;
    }
  
    res.send(`Session saved! You visited this page ${req.session.views} times.`);
  });
  

/***********************
 *  START SERVER
 ***********************/
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
