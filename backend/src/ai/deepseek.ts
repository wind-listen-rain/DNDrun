import OpenAI from "openai";
import type { AIMessage, AIProvider } from "./provider.js";

export class DeepSeekProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "deepseek-v4-flash") {
    this.client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
    this.model = model;
  }

  async chat(messages: AIMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
    });
    return response.choices[0]?.message?.content ?? "";
  }
}
