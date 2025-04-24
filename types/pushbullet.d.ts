declare module 'pushbullet' {
  class PushBullet {
    constructor(apiKey: string);
    
    devices(): Promise<{ devices: any[] }>;
    
    note(
      deviceIden: string | null,
      title: string,
      body: string
    ): Promise<any>;
    
    link(
      deviceIden: string | null,
      title: string,
      url: string,
      body?: string
    ): Promise<any>;
    
    file(
      deviceIden: string | null,
      filePath: string,
      message?: string
    ): Promise<any>;
  }
  
  export = PushBullet;
}