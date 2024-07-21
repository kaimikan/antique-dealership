-- Antique Dealership

-- Create Read Update Delete

-- reading - everyone with access to the site
-- creating updating and deleting - only accessible after logging in through a secret page as an admin

-- Structure
-- admins (id, username, password) - create them only locally without an actual function? so they only have login
-- images (id, name, path, alt, size)
-- categories (id, name, description, filter_words)
-- antiques (id, name, description, category_ids, dimensions_centimeters, cost_euro, reference_number, main_image_id, secondary_images_ids)

CREATE TABLE admins (
	id SERIAL PRIMARY KEY, 
	username TEXT NOT NULL,
	password_hash TEXT NOT NULL, 
);

INSERT INTO admins (username, password_hash) VALUES ('adminOne', '$2a$12$DlQ6FEbBnfVXz0.WBsYjCuThhekUm5IkVivakQn8rH79QcIjG5p66');
-- https://bcrypt-generator.com/
-- adminOne -> 12 rounds bcrypt

CREATE TABLE categories (
	id SERIAL PRIMARY KEY, 
	name TEXT NOT NULL,
	description TEXT NOT NULL, 
	filter_words TEXT[] NOT NULL
);
INSERT INTO categories (name, description, filter_words) 
VALUES ('chairs', 'a category for all chair antiques', '{"chair","chairs","armchair","armchair"}');

CREATE TABLE images (
	id SERIAL PRIMARY KEY, 
	name TEXT NOT NULL,
	path TEXT NOT NULL, 
	alt TEXT NOT NULL,
  img_extension TEXT NOT NULL
);
INSERT INTO images (name, path, alt, img_extension) 
VALUES ('test_img_1', 'assets/images', 'a test image', 'png');
INSERT INTO images (name, path, alt, img_extension) 
VALUES ('test_img_2', 'assets/images', 'a second test image', 'jpg');

CREATE TABLE antiques (
	id SERIAL PRIMARY KEY, 
	name TEXT NOT NULL,
	description TEXT NOT NULL, 
	category_ids INT[] NOT NULL, 
	dimensions_centimeters TEXT NOT NULL, 
	cost_euro FLOAT NOT NULL CHECK (cost_euro BETWEEN 0 AND 10000000), 
	reference_number TEXT, 
	main_image_id INT NOT NULL REFERENCES images(id), 
	secondary_images_ids INT[]
);

INSERT INTO antiques (name, description, category_ids, dimensions_centimeters, cost_euro, reference_number, main_image_id, secondary_images_ids) 
VALUES ('Example Chair', 'A chair used as an example first antique item', '{1}', 
'Height: 140cm; Width: 100cm; Length: 90cm;', 50, '#123123', 1, '{2, 2, 2}');

-- generating a new reference number string in with #(7 digits total filled with 0s and the id)
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_number := '#' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reference_number
BEFORE INSERT ON antiques
FOR EACH ROW
EXECUTE FUNCTION generate_reference_number();