const createGameButton = document.querySelector("#create-game-button");
const createGameContainer = document.querySelector("#create-game-container");
const closeButton = document.querySelector("#close-create-game-form");

createGameButton?.addEventListener("click", (event) => {
  event.preventDefault();

  createGameContainer?.classList.add("visible");
});

closeButton?.addEventListener("click", (event) => {
  event.preventDefault();

  createGameContainer?.classList.remove("visible");
});

createGameContainer?.addEventListener("click", (event) => {
  if (createGameContainer !== event.target) {
    return;
  }

  createGameContainer?.classList.remove("visible");
});
