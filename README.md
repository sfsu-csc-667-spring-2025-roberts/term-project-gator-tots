# 🐊 Gator Tots Present: Bullsh\*t 🎴  
**A Web-Based Multiplayer Bluffing Card Game**

Welcome to **Bullsh\*t**, a fast-paced, deception-driven card game built as a term project for **CSC 667/867** at *San Francisco State University*. In this game, players must lie—or catch others lying—to be the first to ditch all their cards!

---

## 👥 Team Gator Tots (Group 6)

| Name             | GitHub                                            
|------------------|---------------------------------------------------
| John Bagwell     | [sweartypalms](https://github.com/sweartypalms)   
| Meera Shiroya    | [meeras101](https://github.com/meeras101)        
| Rathang Pandit   | [Rathang2004](https://github.com/Rathang2004)     
| Luis Espinosa    | [LAEV415](https://github.com/LAEV415)           


---

## 🎯 Game Overview

> Inspired by [this guide](https://www.instructables.com/How-to-play-BSA-game-of-bluffing/), the game brings the classic card game "Bullsh\*t" to the web.

- 3 to 8 players per game
- One 52-card deck
- Players take turns placing cards face-down in sequential rank (A through K)
- Bluffing is allowed—and encouraged!
- First player to discard all cards wins

---

## ✅ Required Features

### 🔐 Player Registration & Authentication
- User account creation with secure login/logout functionality

### 🛋️ Lobby System
- View available games
- Create a new game
- Join existing games
- Password-protected game support
- Games disappear from the lobby once started

### 🧩 Game Hosting & Joining
- Host sets game name and optional password
- Minimum 3 and maximum 8 players per game
- Join games via game list; enter password if required

### 🕹️ Game Flow

#### Game Start
- Game starts with a 5-second countdown
- Deck dealt to all players
- Players can view only their own cards
- Chat system available in-game

#### Player Turn
- The player with the Ace of Spades starts
- Play 1–4 cards per turn
- Must claim the correct card rank (e.g., "3 Jacks")
- 15-second timer per turn

#### Bluff Calling
- Any player can challenge the last move
- Cards are revealed:
  - If bluff was **true** → bluff caller takes the stack
  - If bluff was **false** → bluffing player takes the stack

#### Game Completion
- First player to discard all cards wins
- Winner is announced in-game

---

## 🧰 Technologies Used

- **Frontend:** Coming soon (currently wireframes only)
- **Backend:**
  - Node.js
  - Express
  - PostgreSQL
- **Deployment:** Render

---

## 📐 Wireframes

### Signed Out Landing / Login
*(Basic login screen with navigation to sign-up page)*

### Sign Up
*(Form for new users to create an account)*

### Signed In Landing (Attempting to Join a Password-Protected Game)
*(Game list UI with password prompt on protected games)*

### Signed In Landing (Settings Clicked)
*(User account and logout options)*

### Game Room
*(Card UI, chat, current turn indicator, bluff button, etc.)*

---

## 🚧 Project Status

**Almost Completed**

The game is fully functional with the following features:

- Player registration and authentication
- Lobby system for creating and joining games
- Game flow including turns, bluffing, and completion

**Remaining Task: Real-Time Game State Tracking**


---

## 📜 License

This project is developed as part of the coursework for **CSC 667/867** at **San Francisco State University**. All rights reserved by Team Gator Tots, 2025.


## 🗄️ Database Setup & Migration

To run the project locally, you'll need to set up the PostgreSQL database named `GatorTotsDb`. Follow the steps below to create and migrate the database:

### ⚙️ Prerequisites
- PostgreSQL installed and running
- Node.js environment set up
- Project dependencies installed (`npm install`)

---


### 🧭 Steps to Create & Migrate the Database

1. **Log into PostgreSQL as the `postgres` user**:
   ```bash
   psql -U postgres
2. (Optional) Drop the existing database (if it already exists):
     ```DROP DATABASE IF EXISTS "GatorTotsDb";```
3. Create the database:  ```CREATE DATABASE "GatorTotsDb";```
4. Run the migration script from project directory:
   ```npm run db:migrate```
