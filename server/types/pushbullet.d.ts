declare module 'pushbullet' {
  export default class PushBullet {
    constructor(apiKey: string);
    push(note: string, title: string): Promise<any>;
  }
} 