import type { AIProvider } from "./provider.js";
import { DeepSeekProvider } from "./deepseek.js";

export type { AIMessage, AIProvider } from "./provider.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "deepseek";

  switch (provider) {
    case "deepseek":
      return new DeepSeekProvider(requireEnv("DEEPSEEK_API_KEY"), process.env.DEEPSEEK_MODEL);
    default:
      throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  }
}
