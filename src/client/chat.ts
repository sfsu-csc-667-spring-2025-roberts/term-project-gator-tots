import { ChatMessage } from "global";
import { socket } from "./socket";
import { cloneTemplate, getRoomId } from "./utils";

const messageContainer =
  document.querySelector<HTMLDivElement>("#chat #messages");

const chatForm = document.querySelector<HTMLFormElement>("#chat form");
const chatInput = document.querySelector<HTMLInputElement>("#chat input");

socket.on(
  `chat:message:${getRoomId()}`,
  ({ message, timestamp }: ChatMessage) => {
    const container = cloneTemplate<HTMLDivElement>("#chat-message-template");

    container.querySelector<HTMLSpanElement>(
      "div span:first-of-type",
    )!.innerText = message;
    container.querySelector<HTMLSpanElement>(
      "div span:last-of-type",
    )!.innerText = new Date(timestamp).toLocaleTimeString();

    messageContainer!.appendChild(container);

    messageContainer?.scrollTo({
      top: messageContainer.scrollHeight,
      behavior: "smooth",
    });
  },
);

chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = chatInput?.value;
  if (!message) {
    return;
  }

  chatInput.value = "";

  fetch(`/chat/${getRoomId()}`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  }).catch((error) => {
    console.error("Error sending message:", error);
  });
});
