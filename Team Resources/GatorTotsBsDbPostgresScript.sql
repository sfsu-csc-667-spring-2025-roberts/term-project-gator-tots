-- PostgreSQL conversion of MySQL schema GatorTotsDb
SET search_path TO "GatorTotsDb";

DROP SCHEMA IF EXISTS "GatorTotsDb" CASCADE;
CREATE SCHEMA "GatorTotsDb";
SET search_path TO "GatorTotsDb";

-- Table: deck
DROP TABLE IF EXISTS deck;
CREATE TABLE deck (
  deck_id INT PRIMARY KEY
);

-- Table: game_card_pile
DROP TABLE IF EXISTS game_card_pile;
CREATE TABLE game_card_pile (
  game_card_pile_id INT PRIMARY KEY
);

-- Table: game_room
DROP TABLE IF EXISTS game_room;
CREATE TABLE game_room (
  game_room_id INT PRIMARY KEY,
  deck_deck_id INT NOT NULL,
  game_card_pile_game_card_pile_id INT NOT NULL,
  game_room_password VARCHAR(45),
  game_room_name VARCHAR(45) UNIQUE,
  min_players INT,
  max_players INT,
  game_started BOOLEAN DEFAULT FALSE,
  game_start_time TIMESTAMP,
  current_players_turn INT,
  FOREIGN KEY (deck_deck_id) REFERENCES deck(deck_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  FOREIGN KEY (game_card_pile_game_card_pile_id) REFERENCES game_card_pile(game_card_pile_id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Table: user
DROP TABLE IF EXISTS "user";
CREATE TABLE "user" (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  user_password VARCHAR(30),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  game_room_id INT,
  game_room_game_room_id INT NOT NULL,
  FOREIGN KEY (game_room_game_room_id) REFERENCES game_room(game_room_id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Table: card
DROP TABLE IF EXISTS card;
CREATE TABLE card (
  card_id INT PRIMARY KEY,
  card_rank INT,
  user_user_id INT NOT NULL,
  deck_deck_id INT NOT NULL,
  game_card_pile_game_card_pile_id INT NOT NULL,
  FOREIGN KEY (user_user_id) REFERENCES "user"(user_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  FOREIGN KEY (deck_deck_id) REFERENCES deck(deck_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  FOREIGN KEY (game_card_pile_game_card_pile_id) REFERENCES game_card_pile(game_card_pile_id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Table: message
DROP TABLE IF EXISTS message;
CREATE TABLE message (
  message_id INT NOT NULL,
  message_content VARCHAR(255),
  message_time TIMESTAMP,
  user_user_id INT NOT NULL,
  game_room_game_room_id INT NOT NULL,
  PRIMARY KEY (message_id, game_room_game_room_id),
  FOREIGN KEY (user_user_id) REFERENCES "user"(user_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  FOREIGN KEY (game_room_game_room_id) REFERENCES game_room(game_room_id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
