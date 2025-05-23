import { getPlayersInGame, getUserCards } from "../server/db/games";
import { socket } from "./socket";

// Get the roomId from the template or URL
const roomId =
  (window as any).gameId || window.location.pathname.split("/").pop();

// Join the Socket.io room for this game
socket.emit("joinRoom", roomId);

// Listen for real-time game state updates from the server
socket.on("game:update", (data) => {
  // Update the UI with the new game state
  updateGameInfo(data.gameInfo);
  getPlayersInGame(data.players);
});

socket.on("game:supposedRank", function (data) {
  const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const h3 = document.getElementById("supposed-card");
  if (h3) {
    h3.innerHTML = "Supposed Card: " + ranks[data.supposedRank - 1];
  }
});

function updateGameInfo(gameInfo: any) {
  // Update game info in the DOM as needed
  const minPlayers = document.getElementById("min-players");
  const maxPlayers = document.getElementById("max-players");
  if (minPlayers) minPlayers.textContent = gameInfo.min_players;
  if (maxPlayers) maxPlayers.textContent = gameInfo.max_players;
}
