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
