export interface Message {
  text: string;
}

export class GraphMessage {
  key: string;
  id: string;
  message: Message;
  arr?: Array<any>;
}
