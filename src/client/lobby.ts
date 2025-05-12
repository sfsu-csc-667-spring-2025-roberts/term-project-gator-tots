import test from "node:test";

const modalButton = document.querySelector(
  "#open-create-modal",
) as HTMLElement | null;
const modal = document.querySelector(
  "#create-game-modal",
) as HTMLElement | null;
const closeButton = modal?.querySelector(".close-button") as HTMLElement | null;
const createGame = document.querySelector("#create-game") as HTMLElement | null;

modalButton?.addEventListener("click", () => {
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "block";
  }
});

closeButton?.addEventListener("click", () => {
  if (modal) {
    modal.style.display = "none";
  }
});

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal!.style.display = "none";
  }
});

createGame?.addEventListener("click", async () => {
  const gameName = (document.getElementById("game-name") as HTMLInputElement)
    .value;
  const password = (document.getElementById("password") as HTMLInputElement)
    .value;
  const minPlayers = (document.getElementById("min-player") as HTMLInputElement)
    .value;
  const maxPlayers = (
    document.getElementById("max-players") as HTMLInputElement
  ).value;

  const data = {
    gameName,
    password,
    minPlayers,
    maxPlayers,
  };

  try {
    const response = await fetch("/create-game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log(result);
  } catch (err) {
    console.error("Error creating game:", err);
  }
});
