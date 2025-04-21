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

// Define the schemas for the tool input (optional JQL string)
const getJiraIssuesSchema = z.object({ jql: z.string().optional() });
const fetchConfluenceDocsSchema = z.object({
  query: z.string().optional(), 
  pageId: z.string().optional(), 
});

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

// Register the fetch_confluence_docs tool
server.tool(
  "fetch_confluence_docs",
  "Fetches Confluence documentation pages by search query or page ID.",
  fetchConfluenceDocsSchema.shape,
  async ({ query, pageId }) => {
    try {
      const auth = Buffer.from(
        `${process.env.CONFLUENCE_EMAIL || process.env.JIRA_EMAIL}:${process.env.CONFLUENCE_API_TOKEN || process.env.JIRA_API_TOKEN}`
      ).toString("base64");
      const host = process.env.CONFLUENCE_HOST || process.env.JIRA_HOST;
      if (!host) throw new Error("CONFLUENCE_HOST env var is required");
      let url = "";

      if (pageId) {
        url = `https://${host}/wiki/rest/api/content/${pageId}?expand=body.storage,title`;
      } else if (query) {
        url = `https://${host}/wiki/rest/api/content/search?cql=${encodeURIComponent(
          `type=page AND text~\"${query}\"`
        )}&expand=title,body.storage`;
      } else {
        throw new Error("Either query or pageId must be provided");
      }

      const resp = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json"
        }
      });

      if (pageId) {
        const page = resp.data;
        return {
          content: [
            {
              type: "text",
              text: `Title: ${page.title}\nContent (HTML):\n${page.body?.storage?.value || "No content"}`
            }
          ]
        };
      } else {
        const results = resp.data.results.map((p: any) => ({
          id: p.id,
          title: p.title,
          content: p.body?.storage?.value || "No content"
        }));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch Confluence docs: ${error?.response?.data?.message || error.message}`
          }
        ]
      };
    }
  }
);

await server.connect(new StdioServerTransport());
