import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import bcrypt from 'bcrypt';
import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-local';
import flash from 'connect-flash';

const app = express();
const port = 3000;

app.use(
  session({
    secret: 'TOP SECRET!!!',
    // resave - gives option to save the session to the db instead of browser
    resave: false,
    saveUninitialized: true,
    cookie: {
      // a cookie now lasts 24 hours
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
// session first
// passport after
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // Use flash middleware

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// TODO eventually get this from .env
const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'antique_dealership',
  password: 'grespass',
  port: 5432,
});
db.connect();

const PAGES = {
  home: 'home',
  categories: 'categories',
  contact: 'contact',
  delivery: 'delivery',
  dashboard: 'dashboard',
  create: 'create',
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

async function getAntiques() {
  try {
    const response = await db.query('SELECT * FROM antiques');
    let antiques = response.rows;

    for (let i = 0; i < antiques.length; i++) {
      // console.log(antiques[i]);
      antiques[i].imageObject = await getAntiqueMainImage(antiques[i]);
    }

    // console.log({ antiques });

    return antiques;
  } catch (error) {
    console.error(error.message);
    return { error: error.message };
  }
}

async function getAntique(id) {
  try {
    const response = await db.query('SELECT * FROM antiques WHERE id = $1', [
      id,
    ]);
    let antique = response.rows[0];

    antique.imageObject = await getAntiqueMainImage(antique);
    antique.secondaryImageObjects = await getAntiqueSecondaryImages(antique);
    console.log('ANTIQUE: ', { antique });

    return antique;
  } catch (error) {
    console.error(error.message);
    return { error: error.message };
  }
}

async function getAntiqueMainImage(antique) {
  try {
    // getting the main image first
    // TODO get secondary images
    const response = await db.query('SELECT * FROM images WHERE id = $1', [
      antique.main_image_id,
    ]);
    const image = response.rows;
    // console.log({ image });

    // row returns an array of selection, but we only want one image object from it
    return image[0];
  } catch (error) {
    console.error(error.message);
    return { error: error.message };
  }
}

async function getAntiqueSecondaryImages(antique) {
  try {
    // getting the main image first
    // TODO get secondary images
    const secondaryImagesIds = antique.secondary_images_ids;
    // console.log({ secondaryImagesIds });

    const response = await db.query(
      ' SELECT * FROM images WHERE id = ANY($1::int[])',
      [secondaryImagesIds]
    );
    const images = response.rows;
    console.log(images);

    // row returns an array of selection, but we only want one image object from it
    return images;
  } catch (error) {
    console.error(error.message);
    return { error: error.message };
  }
}

async function getCategories() {
  try {
    const response = await db.query(' SELECT * FROM categories');
    const categories = response.rows;
    console.log(categories);

    return categories;
  } catch (error) {
    console.error(error.message);
    return { error: error.message };
  }
}

function getFormattedDimensions(dimensionsObject) {
  return `Height: ${dimensionsObject.height}cm; Width: ${dimensionsObject.width}cm; Length: ${dimensionsObject.length}cm;`;
}

app.get('/', async (req, res) => {
  const antiques = await getAntiques();
  res.render('index.ejs', {
    currentPage: PAGES.home,
    pages: PAGES,
    antiques: antiques,
  });
});

app.get('/antique:id', async (req, res) => {
  console.log(req.params.id);
  const antique = await getAntique(req.params.id);
  res.render('antique.ejs', {
    currentPage: PAGES.home,
    pages: PAGES,
    antique: antique,
  });
});

app.get('/contact', (req, res) => {
  res.render('contact.ejs', { currentPage: PAGES.contact, pages: PAGES });
});

app.get('/categories', (req, res) => {
  res.render('categories.ejs', { currentPage: PAGES.categories, pages: PAGES });
});

app.get('/delivery', (req, res) => {
  res.render('delivery.ejs', { currentPage: PAGES.delivery, pages: PAGES });
});

app.get('/login', (req, res) => {
  if (req.user) res.render('./admin/dashboard.ejs', { admin: req.user });
  else {
    const errorMessages = req.flash('error');
    console.log(errorMessages);
    res.render('./admin/login.ejs', { errorMessages });
  }
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login'); // Redirect to login page after successful logout
  });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render('./admin/dashboard.ejs', { admin: req.user });
});

// TODO add back isAuthenticated and req.user as admin when done testing
app.get('/create', async (req, res) => {
  const categories = await getCategories();
  res.render('./admin/create.ejs', {
    admin: { username: 'testing atm' },
    categories: categories,
  });
});

// TODO add back isAuthenticated and req.user as admin when done testing
app.post('/create', async (req, res) => {
  console.log('FORM DATA: ', req.body);
  const name = req.body.name;
  const description = req.body.description;

  const categoryPattern = /^category_\d+$/;
  let matchedCategoriesIds = [];

  for (let key in req.body) {
    if (req.body.hasOwnProperty(key) && categoryPattern.test(key)) {
      console.log(key);
      matchedCategoriesIds.push(Number(key.split('_')[1], 10));
    }
  }

  console.log(matchedCategoriesIds);
  const mainImage = req.body.image;
  const secondaryImages = req.body.images;
  const dimensions = {
    width: req.body.width,
    height: req.body.height,
    length: req.body.length,
  };
  const cost = req.body.cost;

  try {
    const mainImageObject = {
      name: mainImage.split('.')[0],
      path: 'assets/images',
      alt: mainImage.split('.')[0].toLowerCase(),
      img_extension: mainImage.split('.')[1].toLowerCase(),
    };
    console.log({ mainImageObject });
    const resultMainImage = await db.query(
      'INSERT INTO images (name, path, alt, img_extension) VALUES ($1, $2, $3, $4) RETURNING id',
      [
        mainImageObject.name,
        mainImageObject.path,
        mainImageObject.alt,
        mainImageObject.img_extension,
      ]
    );
    console.log('MAIN IMG ID: ', resultMainImage.rows[0].id);
    const mainImageDatabaseId = resultMainImage.rows[0].id;

    let secondaryImageObjects = [];
    secondaryImages.map((secondaryImage) => {
      secondaryImageObjects.push({
        name: secondaryImage.split('.')[0],
        path: 'assets/images',
        alt: secondaryImage.split('.')[0].toLowerCase(),
        img_extension: secondaryImage.split('.')[1].toLowerCase(),
      });
    });
    console.log(secondaryImageObjects);

    let secondaryImagesDatabaseIds = [];
    for (let i = 0; i < secondaryImageObjects.length; i++) {
      const resultSecondaryImg = await db.query(
        'INSERT INTO images (name, path, alt, img_extension) VALUES ($1, $2, $3, $4) RETURNING id',
        [
          secondaryImageObjects[i].name,
          secondaryImageObjects[i].path,
          secondaryImageObjects[i].alt,
          secondaryImageObjects[i].img_extension,
        ]
      );
      console.log('SECONDARY IMG ID: ', resultSecondaryImg.rows[0].id);
      const secondaryImgId = resultSecondaryImg.rows[0].id;
      secondaryImagesDatabaseIds.push(secondaryImgId);
    }
    // TODO save images to public/assets/images

    const antiqueObject = {
      name: name,
      description: description,
      categoriesIds: matchedCategoriesIds,
      mainImage: mainImage,
      secondaryImages: secondaryImages,
      dimensions: getFormattedDimensions(dimensions),
      cost: Number(cost, 10),
      referenceNumber: '#123123',
      mainImageId: mainImageDatabaseId,
      secondaryImagesIds: secondaryImagesDatabaseIds,
    };
    console.log(antiqueObject);

    try {
      await db.query(
        'INSERT INTO antiques (name, description, category_ids, dimensions_centimeters, cost_euro, reference_number, main_image_id, secondary_images_ids) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          antiqueObject.name,
          antiqueObject.description,
          antiqueObject.categoriesIds,
          antiqueObject.dimensions,
          antiqueObject.cost,
          antiqueObject.referenceNumber,
          antiqueObject.mainImageId,
          antiqueObject.secondaryImagesIds,
        ]
      );

      res.redirect('/');
    } catch (error) {
      console.error(error.message);
      res.redirect('/create');
    }
  } catch (error) {
    console.error(error.message);
    res.redirect('/create');
  }
});

app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true, // Enable flash messages
  })
);

passport.use(
  new Strategy(async function verify(username, password, cb) {
    // if the names match the form names for the username and pass fields we do not need to do req.body.username and req.body.password
    // to get them, they will assign to the function as seen below
    console.log(username, password);

    try {
      const result = await db.query(
        'SELECT * FROM admins WHERE username = $1',
        [username]
      );
      if (result.rows.length > 0) {
        const admin = result.rows[0];
        const storedHashedPassword = admin.password_hash;
        bcrypt.compare(password, storedHashedPassword, (err, result) => {
          if (err) {
            console.log('Problem with bcrypt!');
            return cb(err);
          } else {
            if (result) {
              console.log('Returning matched admin!');
              const errors = null;
              return cb(errors, admin);
            } else {
              const errors = null;
              const isUserAuthenticated = false;
              // able to pass messages cause of connect-flash
              console.log('Incorrect password!');
              return cb(errors, isUserAuthenticated, {
                message: 'Incorrect password!',
              });
            }
          }
        });
      } else {
        console.log('Admin not found!');
        return cb(null, false, { message: 'Admin not found!' });
      }
    } catch (err) {
      console.log('SQL Query error!');
      return cb(err);
    }
  })
);

// saves user to local session
passport.serializeUser((user, cb) => {
  cb(null, user);
});

// retrieves user from local session
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
