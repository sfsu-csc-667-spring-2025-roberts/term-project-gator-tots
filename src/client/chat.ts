import { ChatMessage } from "global";
import { socket } from "./socket";
import { cloneTemplate, getRoomId } from "./utils";

const messageContainer =
  document.querySelector<HTMLDivElement>("#chat #messages");

const chatForm = document.querySelector<HTMLFormElement>("#chat form");
const chatInput = document.querySelector<HTMLInputElement>("#chat input");

const loadMessages = async () => {
  try {
    const roomId = getRoomId();
    const response = await fetch(`/chat/${roomId}/messages`);
    const messages = await response.json();

    messages.forEach(
      ({
        username,
        message_content,
        timestamp,
      }: {
        username: string;
        message_content: string;
        timestamp: string;
      }) => {
        const container = cloneTemplate<HTMLDivElement>(
          "#chat-message-template",
        );

        container.querySelector<HTMLSpanElement>(
          "div span:first-of-type",
        )!.innerText = `${username}: ${message_content}`;
        container.querySelector<HTMLSpanElement>(
          "div span:last-of-type",
        )!.innerText = new Date(timestamp).toLocaleTimeString();

        messageContainer!.appendChild(container);
      },
    );
  } catch (error) {
    console.error("Error loading messages:", error);
  }
};

// Call `loadMessages` when the page loads
document.addEventListener("DOMContentLoaded", () => {
  loadMessages();
});

socket.on(
  `chat:message:${getRoomId()}`,
  ({ message, sender, timestamp }: ChatMessage) => {
    const container = cloneTemplate<HTMLDivElement>("#chat-message-template");

    container.querySelector<HTMLSpanElement>(
      "div span:first-of-type",
    )!.innerText = `${sender.username}: ${message}`;
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
  const roomId = getRoomId();
  const username = document.querySelector<HTMLInputElement>("username")?.value;

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
