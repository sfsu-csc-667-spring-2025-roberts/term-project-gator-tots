Gator Tots BS ReadMe

How to Migrate GatorTotsDB after Postgress install

1. Log into Postgres with command:
   psql -U postgres
   - enter password when prompted
2. Drop old database if it exists with the following line (entered in psql terminal):
   DROP DATABASE IF EXISTS "GatorTotsDB";
   - It won't let you drop the database if you are currently connected to it, to connect to a
     different one, run the command: \c postgres
3. Create GatorTotsDB database with the following line:
   CREATE DATABASE "GatorTotsDB";
4. Enter the following pg-migration script in commandline:
   npm run db:migrate
5. Done

TO-DO:

- Implement game creation feature

  - create game-creation form
  - create field where game instances show in lobby
    - make game create and game join buttons with proper routing
  - make sure data is added to db upon creation
  - have game instances show in the lobby
  - route game join and password prompt if game is protected
  - add 'start game' feature which initializes start of game

- Implement game-flow and game-logic
  - seat players in order of join
  - once minimum number of players joined, host can 'start game'
  - all cards of one deck are distributed among players in clockwise order (ascending order after the host), starting with host
  - player with ace of spades is prompted to go with the first turn
    - player has to play 1-4 cards
  - game will tell lobby in chat how many cards were played and which card it's supposed to be
  - the order of turns is also ascending order after the first player's turn
  - there will be a 'Bullshit' button where any other player can call a 'bluff'
  - implement bluff check logic
    - if (bluff)
      -player who played cards inherits stack of cards
    - else if
      - player who called bluff inherits stack of cards
  - once a player has 0 cards, they are declared the winner.
  - winner is declared in chat by game server
