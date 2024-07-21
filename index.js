import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import bcrypt from 'bcrypt';
import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-local';
import flash from 'connect-flash';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
// adding json parsing after adding enctype="multipart/form-data" to the create.ejs form
app.use(bodyParser.json());
app.use(express.static('public'));

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/assets/images/'); // Directory where files will be saved
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const filename = `${basename}${timestamp}${ext}`;
    file.timestampedFilename = filename; // Store timestamped filename in the file object
    cb(null, filename);
  },
});
const upload = multer({ storage: storage });

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

// handling errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

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
  // admin pages
  dashboard: 'dashboard',
  create: 'create',
};

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

    antique.categoriesObjects = await getAntiqueCategories(
      antique.category_ids
    );
    antique.imageObject = await getAntiqueMainImage(antique);
    antique.secondaryImageObjects = await getAntiqueSecondaryImages(antique);
    console.log(antique.dimensions_centimeters);
    antique.dimensionsObject = getObjectDimensions(
      antique.dimensions_centimeters
    );
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
    // console.log(images);

    // row returns an array of selection, but we only want one image object from it
    return images;
  } catch (error) {
    console.error(error.message);
    return { error: error.message };
  }
}

async function getAntiquesFromCategory(categoryID) {
  try {
    const response = await db.query(
      ' SELECT * FROM antiques WHERE $1 = ANY (category_ids)',
      [categoryID]
    );
    const antiques = response.rows;
    console.log('ANTIQUES OF THIS CATEGORY: ', antiques);

    for (let i = 0; i < antiques.length; i++) {
      antiques[i].imageObject = await getAntiqueMainImage(antiques[i]);
      antiques[i].secondaryImageObjects = await getAntiqueSecondaryImages(
        antiques[i]
      );
      console.log(antiques[i].dimensions_centimeters);
      antiques[i].dimensionsObject = getObjectDimensions(
        antiques[i].dimensions_centimeters
      );
      console.log('LOADED ANTIQUE: ', antiques[i]);
    }

    return antiques;
  } catch (error) {
    console.error(error.message);
    return { error: error.message };
  }
}

async function getCategories() {
  try {
    const response = await db.query(' SELECT * FROM categories');
    const categories = response.rows;
    // console.log(categories);

    return categories;
  } catch (error) {
    console.error(error.message);
    return { error: error.message };
  }
}

async function getAntiqueCategories(categoryIds) {
  try {
    const response = await db.query(
      ' SELECT * FROM categories WHERE id = ANY($1::int[])',
      [categoryIds]
    );
    const categories = response.rows;
    // console.log(categories);

    // row returns an array of selection, but we only want one image object from it
    return categories;
  } catch (error) {
    console.error(error.message);
    return { error: error.message };
  }
}

function getFormattedDimensions(dimensionsObject) {
  return `Height: ${dimensionsObject.height}cm; Width: ${dimensionsObject.width}cm; Length: ${dimensionsObject.length}cm;`;
}

function getObjectDimensions(formattedDimensions) {
  // Regular expressions to extract height, width, and length
  const heightRegex = /Height:\s(\d+)cm;/;
  const widthRegex = /Width:\s(\d+)cm;/;
  const lengthRegex = /Length:\s(\d+)cm;/;

  // Extract height, width, and length values
  const heightMatch = formattedDimensions.match(heightRegex);
  const widthMatch = formattedDimensions.match(widthRegex);
  const lengthMatch = formattedDimensions.match(lengthRegex);

  // Store the extracted values in variables
  const height = heightMatch ? heightMatch[1] : null;
  const width = widthMatch ? widthMatch[1] : null;
  const length = lengthMatch ? lengthMatch[1] : null;

  const dimensionsObject = {
    width: width,
    height: height,
    length: length,
  };
  return dimensionsObject;
}

app.get('/', async (req, res) => {
  const antiques = await getAntiques();
  const categories = await getCategories();
  res.render('index.ejs', {
    currentPage: PAGES.home,
    pages: PAGES,
    antiques: antiques,
    categories: categories,
  });
});

app.get('/antique:id', async (req, res) => {
  console.log(req.params.id);
  const antique = await getAntique(req.params.id);
  const categories = await getCategories();
  res.render('antique.ejs', {
    currentPage: PAGES.home,
    pages: PAGES,
    antique: antique,
    categories: categories,
  });
});

app.get('/controlantique:id', isAuthenticated, async (req, res) => {
  console.log(req.params.id);
  const antique = await getAntique(req.params.id);
  res.render('./admin/antique-control.ejs', {
    currentPage: PAGES.dashboard,
    pages: PAGES,
    antique: antique,
    admin: req.user,
  });
});

app.get('/contact', async (req, res) => {
  const categories = await getCategories();
  res.render('contact.ejs', {
    currentPage: PAGES.contact,
    pages: PAGES,
    categories: categories,
  });
});

app.get('/filter-:categoryID', async (req, res) => {
  console.log('GOT ID FOR CATEGORY = TO: ', req.params.categoryID);
  const antiquesFromCategory = await getAntiquesFromCategory(
    req.params.categoryID
  );
  const categories = await getCategories();
  const currentCategory = categories.find(
    (category) => category.id == req.params.categoryID
  );
  res.render('categories.ejs', {
    currentPage: PAGES.categories,
    pages: PAGES,
    antiques: antiquesFromCategory,
    currentCategory: currentCategory,
    categories: categories,
  });
});

app.get('/categories', async (req, res) => {
  const categories = await getCategories();
  console.log('CATEGORIES: ', categories);
  res.render('categories.ejs', {
    currentPage: PAGES.categories,
    pages: PAGES,
    categories: categories,
  });
});

app.get('/delivery', async (req, res) => {
  const categories = await getCategories();
  res.render('delivery.ejs', {
    currentPage: PAGES.delivery,
    pages: PAGES,
    categories: categories,
  });
});

app.get('/login', async (req, res) => {
  if (req.user) {
    console.log(req.user);

    const antiques = await getAntiques();
    res.render('./admin/dashboard.ejs', {
      currentPage: PAGES.dashboard,
      pages: PAGES,
      antiques: antiques,
      admin: req.user,
    });
  } else {
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

app.get('/dashboard', isAuthenticated, async (req, res) => {
  console.log(req.user);

  const antiques = await getAntiques();
  res.render('./admin/dashboard.ejs', {
    currentPage: PAGES.dashboard,
    pages: PAGES,
    antiques: antiques,
    admin: req.user,
  });
});

app.get('/create', isAuthenticated, async (req, res) => {
  const categories = await getCategories();
  res.render('./admin/create.ejs', {
    admin: req.user,
    categories: categories,
    currentPage: PAGES.create,
    pages: PAGES,
  });
});

app.get('/update:id', isAuthenticated, async (req, res) => {
  console.log('UPDATE ID: ', req.params.id);
  const antique = await getAntique(req.params.id);
  const categories = await getCategories();
  res.render('./admin/update-antique.ejs', {
    admin: req.user,
    antique: antique,
    categories: categories,
    currentPage: PAGES.create,
    pages: PAGES,
  });
});

app.post('/contact', (req, res) => {
  console.log('Received a contact form submition.');
  console.log({
    name: req.body.name,
    email: req.body.email,
    message: req.body.message,
  });
  // TODO send email here
  res.redirect('/');
});

app.post(
  '/update',
  isAuthenticated,
  upload.fields([{ name: 'image' }, { name: 'images' }]),
  async (req, res, next) => {
    console.log('Updating antique with id...: ', req.body.antiqueID);
    // TODO Update Name, Description & Cost Fields
    const updatedName = req.body.name;
    const updatedDescription = req.body.description;
    const updatedCost = req.body.cost;
    // TODO Update Dimensions
    const updatedDimensions = getFormattedDimensions({
      width: req.body.width,
      height: req.body.height,
      length: req.body.length,
    });
    // TODO Update Categories
    const categoryPattern = /^category_\d+$/;
    let matchedCategoriesIds = [];

    for (let key in req.body) {
      if (
        Object.prototype.hasOwnProperty.call(req.body, key) &&
        categoryPattern.test(key)
      ) {
        console.log('KEY: ', key);
        const categoryID = Number(key.split('_')[1], 10);
        matchedCategoriesIds.push(categoryID);
      }
    }
    console.log(matchedCategoriesIds);
    const updatedCategoryIds = matchedCategoriesIds;
    let updatedSecondaryImagesIDs = [];
    // Update Main Image (overwrite local image with multer, update db image in images table)
    // Step 0. Check if any new image was loaded
    const mainImg = req.files['image'] ? req.files['image'][0] : undefined;
    if (mainImg) {
      // Step 1. get old main object
      const oldMainImgObject = (
        await db.query('SELECT * FROM images WHERE id = $1', [
          req.body.mainImageID,
        ])
      ).rows[0];
      console.log(oldMainImgObject);
      const mainImgId = oldMainImgObject.id;
      console.log('OLD MAIN IMAGE ID: ', mainImgId);

      // Step 2. delete old image local version
      const fileName =
        oldMainImgObject.name + '.' + oldMainImgObject.img_extension; // Get the file name from query parameters
      const filePath = path.join('public/assets/images/', fileName);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          // return res.status(500).send('Error deleting file.');
        }
        console.log('File deleted successfully.');
      });

      // Step 3. update the main image value in the database
      const newMainImage = mainImg.timestampedFilename;

      const mainImageNameSplit = newMainImage.split('.');
      const totalSplitParts = mainImageNameSplit.length;
      const mainImageExtension =
        mainImageNameSplit[totalSplitParts - 1].toLowerCase();
      const mainImageName = mainImageNameSplit.slice(0, -1).join('.');

      const mainImageObject = {
        name: mainImageName,
        path: 'assets/images',
        alt: mainImageName.toLowerCase(),
        img_extension: mainImageExtension,
      };
      console.log({ mainImageObject });
      await db.query(
        'UPDATE images SET name = $2, path = $3, alt = $4, img_extension = $5 WHERE id = $1',
        [
          mainImgId,
          mainImageObject.name,
          mainImageObject.path,
          mainImageObject.alt,
          mainImageObject.img_extension,
        ]
      );
    }
    // TODO Update Secondary Images (here we straight up delete them and create new ones, since they are not as essential as the main images)
    // Step 0. Check if any new images was loaded
    const secondaryImgs = req.files['images'] || [];
    if (secondaryImgs.length > 0) {
      // Step 1. Get the old images from the db
      console.log(
        'What old secondary img ids do we get from the form: ',
        req.body.secondaryImagesIDs
      );
      let secondaryImagesIDs = req.body.secondaryImagesIDs.split(',');
      console.log(secondaryImagesIDs);
      const imgNames = await db.query(
        "SELECT name || '.' || img_extension AS filename FROM images WHERE id = ANY($1::int[])",
        [secondaryImagesIDs]
      );
      console.log('SECONDARY IMG NAMES TO DELETE: ', imgNames.rows); // Expecting an array of filenames in the request body
      // Step 2. delete old images from the db
      await db.query('DELETE FROM images WHERE id = ANY($1::int[])', [
        secondaryImagesIDs,
      ]);

      // Step 3. delete old images locally
      const filenames = imgNames.rows.map((imgName) => imgName.filename);
      console.log(filenames);

      if (!Array.isArray(filenames) || filenames.length === 0) {
        console.log('No filenames provided.');
      } else {
        const filePaths = filenames.map((filename) =>
          path.join('public/assets/images/', filename)
        );

        let deleteCount = 0;
        const errors = [];

        filePaths.forEach((filePath) => {
          fs.unlink(filePath, (err) => {
            if (err) {
              errors.push(`Failed to delete ${filePath}: ${err.message}`);
            } else {
              deleteCount++;
            }

            if (deleteCount + errors.length === filenames.length) {
              if (errors.length > 0) {
                console.log({
                  message: 'Some files could not be deleted.',
                  errors,
                });
              }
              console.log('All files deleted successfully.');
            }
          });
        });
      }

      // Step 4. add new secondary images to db
      let secondaryImageObjects = [];
      let secondaryImages = secondaryImgs;
      secondaryImages.map((secondaryImage) => {
        const secondaryImageNameSplit =
          secondaryImage.timestampedFilename.split('.');
        const totalSplitParts = secondaryImageNameSplit.length;
        const secondaryImageExtension =
          secondaryImageNameSplit[totalSplitParts - 1].toLowerCase();
        const secondaryImageName = secondaryImageNameSplit
          .slice(0, -1)
          .join('.');

        secondaryImageObjects.push({
          name: secondaryImageName,
          path: 'assets/images',
          alt: secondaryImageName.toLowerCase(),
          img_extension: secondaryImageExtension,
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
        updatedSecondaryImagesIDs = secondaryImagesDatabaseIds;
      }
      // Step 5. update secondary images ids field for the antique
    }
    // TODO Remove single secondary Images

    // TODO Add onto existing secondary Images

    if (updatedSecondaryImagesIDs.length == 0) {
      await db.query(
        'UPDATE antiques SET name = $2, description = $3, cost_euro = $4, dimensions_centimeters = $5, category_ids = $6 WHERE id = $1',
        [
          req.body.antiqueID,
          updatedName,
          updatedDescription,
          updatedCost,
          updatedDimensions,
          updatedCategoryIds,
        ]
      );
    } else {
      await db.query(
        'UPDATE antiques SET name = $2, description = $3, cost_euro = $4, dimensions_centimeters = $5, category_ids = $6, secondary_images_ids = $7 WHERE id = $1',
        [
          req.body.antiqueID,
          updatedName,
          updatedDescription,
          updatedCost,
          updatedDimensions,
          updatedCategoryIds,
          updatedSecondaryImagesIDs,
        ]
      );
    }
    res.redirect('/dashboard');
  }
);

app.post(
  '/create',
  isAuthenticated,
  upload.fields([{ name: 'image' }, { name: 'images' }]),
  async (req, res, next) => {
    // Check if files were uploaded
    const mainImg = req.files['image'] ? req.files['image'][0] : undefined;

    // Multiple files (secondary images)
    const secondaryImgs = req.files['images'] || [];

    console.log('Main Image:', mainImg);
    console.log('Secondary Images:', secondaryImgs);

    console.log('FORM DATA: ', req.body);
    const name = req.body.name;
    const description = req.body.description;

    const categoryPattern = /^category_\d+$/;
    let matchedCategoriesIds = [];

    for (let key in req.body) {
      // before file upload form
      // if (req.body.hasOwnProperty(key) && categoryPattern.test(key)) {
      //   console.log(key);
      //   matchedCategoriesIds.push(Number(key.split('_')[1], 10));
      // }
      if (
        Object.prototype.hasOwnProperty.call(req.body, key) &&
        categoryPattern.test(key)
      ) {
        console.log('KEY: ', key);
        console.log();
        const categoryID = Number(key.split('_')[1], 10);
        matchedCategoriesIds.push(categoryID);
      }
    }

    console.log(matchedCategoriesIds);
    const mainImage = mainImg.timestampedFilename;
    const secondaryImages = secondaryImgs;
    const dimensions = {
      width: req.body.width,
      height: req.body.height,
      length: req.body.length,
    };
    const cost = req.body.cost;

    try {
      const mainImageNameSplit = mainImage.split('.');
      const totalSplitParts = mainImageNameSplit.length;
      const mainImageExtension =
        mainImageNameSplit[totalSplitParts - 1].toLowerCase();
      const mainImageName = mainImageNameSplit.slice(0, -1).join('.');

      const mainImageObject = {
        name: mainImageName,
        path: 'assets/images',
        alt: mainImageName.toLowerCase(),
        img_extension: mainImageExtension,
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
        const secondaryImageNameSplit =
          secondaryImage.timestampedFilename.split('.');
        const totalSplitParts = secondaryImageNameSplit.length;
        const secondaryImageExtension =
          secondaryImageNameSplit[totalSplitParts - 1].toLowerCase();
        const secondaryImageName = secondaryImageNameSplit
          .slice(0, -1)
          .join('.');

        secondaryImageObjects.push({
          name: secondaryImageName,
          path: 'assets/images',
          alt: secondaryImageName.toLowerCase(),
          img_extension: secondaryImageExtension,
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

        res.redirect('/dashboard');
      } catch (error) {
        console.error(error.message);
        res.redirect('/create');
      }
    } catch (error) {
      console.error(error.message);
      res.redirect('/create');
    }
  }
);

app.post('/delete', isAuthenticated, async (req, res) => {
  console.log(req.body.antiqueID);
  try {
    const antique = await getAntique(req.body.antiqueID);
    console.log('Antique to delete: ', antique);
    // delete the antique
    await db.query('DELETE FROM antiques WHERE id = $1', [req.body.antiqueID]);

    // delete associated main image as well (if they are not found in other antiques)
    let mainImageId = antique.main_image_id;
    let secondaryImagesIds = antique.secondary_images_ids;
    const imagesIdsToDelete = [mainImageId, ...secondaryImagesIds];

    console.log('DELETE IDS: ', imagesIdsToDelete);
    console.log('IMAGES TO DELETE IDS: ', imagesIdsToDelete);
    const imgNames = await db.query(
      "SELECT name || '.' || img_extension AS filename FROM images WHERE id = ANY($1::int[])",
      [imagesIdsToDelete]
    );
    console.log('IMG NAMES TO DELETE: ', imgNames.rows); // Expecting an array of filenames in the request body
    await db.query('DELETE FROM images WHERE id = ANY($1::int[])', [
      imagesIdsToDelete,
    ]);

    // remove local images
    const filenames = imgNames.rows.map((imgName) => imgName.filename);
    console.log(filenames);

    if (!Array.isArray(filenames) || filenames.length === 0) {
      console.log('No filenames provided.');
    } else {
      const filePaths = filenames.map((filename) =>
        path.join('public/assets/images/', filename)
      );

      let deleteCount = 0;
      const errors = [];

      filePaths.forEach((filePath) => {
        fs.unlink(filePath, (err) => {
          if (err) {
            errors.push(`Failed to delete ${filePath}: ${err.message}`);
          } else {
            deleteCount++;
          }

          if (deleteCount + errors.length === filenames.length) {
            if (errors.length > 0) {
              console.log({
                message: 'Some files could not be deleted.',
                errors,
              });
            }
            return console.log('All files deleted successfully.');
          }
        });
      });
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    res.redirect('/dashboard');
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
