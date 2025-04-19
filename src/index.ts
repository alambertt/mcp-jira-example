import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

// Get the directory name of the current module (for resolving .env path)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//! Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Create a new MCP server instance with name and version
const server = new McpServer({
  name: "MCP Jira Server",
  version: "0.1.0"
});

// Define the schema for the tool input (optional JQL string)
const getJiraIssuesSchema = z.object({ jql: z.string().optional() });

// Register a tool on the MCP server to fetch Jira issues
server.tool(
  "get_jira_issues", // Tool name
  "Fetches Jira issues using an optional JQL query.", // Tool description
  getJiraIssuesSchema.shape, // Tool input schema
  async ({ jql }) => { // Tool implementation
    try {
      //* Prepare basic auth header using Jira email and API token from env vars
      const auth = Buffer.from(
        `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
      ).toString("base64");
      // Build Jira API URL, append JQL if provided
      const url = `https://${process.env.JIRA_HOST}/rest/api/3/search` +
        (jql ? `?jql=${encodeURIComponent(jql)}` : "");
      
      // Make GET request to Jira API
      const resp = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json"
        }
      });
      // Map response to array of issue keys, summaries, and descriptions
      const issues = resp.data.issues.map((i: any) => ({
        key: i.key,
        summary: i.fields.summary,
        description: i.fields.description,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(issues, null, 2)
          }
        ]
      };
    } catch (error: any) {
      // On error, return error message
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch Jira issues: ${error?.response?.data?.errorMessages?.join(", ") || error.message}`
          }
        ]
      };
    }
  },
);

// Start the MCP server using stdio transport
await server.connect(new StdioServerTransport());
