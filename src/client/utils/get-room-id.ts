let roomId: string | null = null;

const getRoomId = (): string => {
  if (roomId == null) {
    roomId = document.querySelector<HTMLInputElement>("#room-id")!.value;
  }

  if (roomId == null) {
    throw new Error("Room ID not found");
  }

  return roomId;
};

export { getRoomId };
