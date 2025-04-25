export type User = {
  id: string;
  email: string;
  gravatar: string;
};

export type ChatMessage = {
  message: string;
  sender: User;
  timestamp: Date;
};
