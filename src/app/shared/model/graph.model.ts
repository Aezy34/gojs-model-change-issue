export class ChatEntityMessage {
  source: string;
  text: string;

  constructor(text, source) {
    this.source = source;
    this.text = text;
  }
}

export class ChatGraphMessage {
  key: string;
  id: string;
  message: ChatEntityMessage;
  nextGroupIdList: string[];
  prevGroupIdList: string[];
  category: string;

  constructor(id, message) {
    this.key = id;
    this.id = id;
    if (message) {
      this.category = message.source;
      this.message = message;
    } else {
      this.category = "AGENT";
      this.message = new ChatEntityMessage(1, "Completely new message");
    }
    this.nextGroupIdList = [];
    this.prevGroupIdList = [];
  }
}
