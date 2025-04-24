import { socket } from "../socket";

socket.on("test", (data: any) => {
  console.log("test", { data });
});

export { socket };
