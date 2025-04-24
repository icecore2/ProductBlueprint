
declare module 'pushover' {
  interface PushoverOptions {
    token: string;
    user: string;
    title?: string;
    message: string;
    url?: string;
    url_title?: string;
    priority?: number;
    sound?: string;
    device?: string;
  }
  
  class Pushover {
    constructor(options: { token: string; user: string });
    
    send(options: PushoverOptions): Promise<any>;
  }
  
  export = Pushover;
}
