export type User = {
  user_id: string;
  username: string;
};

export type ChatMessage = {
  message: string;
  sender: User;
  timestamp: Date;
};
