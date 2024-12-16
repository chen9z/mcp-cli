import { Command } from "commander";
import path from "path";
import fs from "fs";
import os from "os";
import { callOpenAIStream } from "./llm/llm";
import { MCPClient } from "./mcp/client";

interface Config {
  model: string;
  prompt: string;
  apiKey: string;
  apiUrl: string;
  mcpServers: {
    [key: string]: {
      command: string;
      args: string[];
    };
  };
}

const CONFIG_FILE = path.join(os.homedir(), "/.mcp-cli/config.json");
const ensureConfigDir = () => {
  const configDir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
};

const loadConfig = () => {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  }
  return null;
};

const saveConfig = (config: Config) => {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};

const app = new Command();

app
  .version("1.0.0")
  .description("MCP CLI")
  .option("-m, --model <value>", "select model")
  .option("-p, --prompt <value>", "prompt")
  .option("-a, --apiKey <value>", "api key")
  .option("-u, --apiUrl <value>", "api url")
  .action(async (options) => {
    if (!options || Object.keys(options).length === 0) {
      console.log("Please provide a options");
      return;
    }
    const config = loadConfig() || {};
    config.model = options.model || config.model;
    config.prompt = options.prompt || config.prompt;
    config.apiKey = options.apiKey || config.apiKey;
    config.apiUrl = options.apiUrl || config.apiUrl;

    if (!config || !config.prompt || config.prompt.trim() === "") {
      console.log("Please provide a prompt");
      return;
    }

    if (!config.apiKey || !config.apiUrl) {
      console.log("Please provide a apiKey key and apiUrl");
      return;
    }

    saveConfig(config);

    if (config.mcpServers && Object.keys(config.mcpServers).length != 0) {
      console.log("start init mcpServers");
      for (const [name, server] of Object.entries(config.mcpServers)) {
        try {
          const mcpClient = new MCPClient();
          await mcpClient.connect(name, server.command, server.args);
          console.log(`init mcpServer: ${name} success`);
        } catch (error) {
          console.error(`init mcpServer: ${name} failed:`, error);
        }
      }
    }

    try {
      const stream = await callOpenAIStream(config);
      process.stdout.write("\nResponse:");
      for await (const chunk of stream) {
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
      }
      process.stdout.write("\n");
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
    }
  });

app.parse();
