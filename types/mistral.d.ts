declare module '@mistralai/mistralai' {
  export class MistralClient {
    constructor(apiKey: string);
    chat(params: {
      model: string;
      messages: Array<{ role: string; content: string }>;
      temperature?: number;
      max_tokens?: number;
    }): Promise<{
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    }>;
  }
} 