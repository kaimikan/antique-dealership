import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import bcrypt from 'bcrypt';

const app = express();
const port = 3000;

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

    const imagesIdsString = `(${secondaryImagesIds.join(', ')})`;
    // console.log(imagesIdsString);

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

app.get('/contact', async (req, res) => {
  res.render('contact.ejs', { currentPage: PAGES.contact, pages: PAGES });
});

app.get('/categories', async (req, res) => {
  res.render('categories.ejs', { currentPage: PAGES.categories, pages: PAGES });
});

app.get('/delivery', async (req, res) => {
  res.render('delivery.ejs', { currentPage: PAGES.delivery, pages: PAGES });
});

app.get('/login', async (req, res) => {
  res.render('login.ejs', {});
});

app.post('/login', async (req, res) => {
  console.log('FORM RETURN: ', req.body);
  const username = req.body.username;
  const loginPassword = req.body.password;

  try {
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [
      username,
    ]);
    if (result.rows.length > 0) {
      const admin = result.rows[0];
      const storedHashPassword = admin.password_hash;
      console.log(admin);

      // don't need to specify salt rounds since the .compare method automatically extracts them from the hash itself
      bcrypt.compare(loginPassword, storedHashPassword, (err, result) => {
        if (err) {
          console.error(err.message);
        } else {
          if (result) {
            console.log(result);
            res.render('login.ejs', { isAdmin: true });
          } else {
            res.render('login.ejs', {
              message: 'Unsuccesful Login, try again!',
            });
          }
        }
      });
    } else {
      res.render('login.ejs', {
        message: 'Unsuccesful Login, try again!',
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
