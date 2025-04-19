# MCP Jira Server

A Model Context Protocol (MCP) server for exposing Jira issues as a tool, enabling seamless integration with AI agents and developer tools such as GitHub Copilot in Visual Studio Code. You can also use this server with other MCP-compatible tools such as Cursor and Windsurf.

## Overview

This project implements an MCP server in TypeScript that connects to your Jira instance and exposes a tool to fetch Jira issues using JQL (Jira Query Language). It is designed to be used as a backend for AI-powered developer workflows.

## Features

- **Fetch Jira Issues:**
  - Exposes a `get_jira_issues` tool that retrieves Jira issues using an optional JQL query.
  - Returns issue keys and summaries for easy reference.
- **Secure Authentication:**
  - Uses Jira email and API token for authentication (configured via environment variables).
- **MCP Protocol:**
  - Communicates over stdio, compatible with GitHub Copilot, Cursor, Windsurf, and other MCP clients.

## Prerequisites

- Node.js (v18 or later recommended) or [Bun](https://bun.sh/) (v1.0+)
- A Jira Cloud account with API access
- Jira API token ([create one here](https://id.atlassian.com/manage-profile/security/api-tokens))

## Installation

1. **Clone the repository:**

   ```bash
   git clone <this-repo-url>
   cd mcp-jira-server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or, if you use bun:
   bun install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the project root with the following content:

   ```env
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-jira-api-token
   JIRA_HOST=your-domain.atlassian.net
   ```

## Running the Server

You can run the MCP Jira Server using either Node.js (from the built JavaScript) or Bun (directly from TypeScript):

### Using Node.js

1. **Build the server:**

   ```bash
   npm run build
   ```

2. **Run the server:**

   ```bash
   node build/index.js
   ```

### Using Bun (Recommended for Development)

You can run the TypeScript source directly with Bun:

```bash
bun src/index.ts
```

Or use the provided VS Code configuration:

#### VS Code MCP Extension

If you use the [MCP VS Code extension](https://marketplace.visualstudio.com/items?itemName=modelcontextprotocol.mcp), the included `.vscode/mcp.json` is already set up to launch the server with Bun:

```jsonc
{
    "servers": {
        "jira-mcp": {
            "type": "stdio",
            "command": "bun",
            "args": [
                "${workspaceFolder}/src/index.ts"
            ]
        }
    }
}
```

This allows you to start the server directly from the MCP extension in VS Code.

## Usage with GitHub Copilot in VS Code

To use this MCP server as a tool provider for GitHub Copilot in VS Code:

1. **Install the [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) extension** in VS Code.
2. **Configure Copilot to use your MCP server:**
   - Open your Copilot configuration file (for example, `~/.copilot/config.json` or the relevant settings location for your platform).
   - Add the following entry:

     ```json
     {
       "mcpServers": {
         "MCP Jira Server": {
           "command": "/absolute/path/to/mcp-jira-server/build/index.js"
         }
       }
     }
     ```

   - Or, if you use Bun and want to run the TypeScript directly:

     ```json
     {
       "mcpServers": {
         "MCP Jira Server": {
           "command": "bun",
           "args": ["/absolute/path/to/mcp-jira-server/src/index.ts"]
         }
       }
     }
     ```

   - Replace the paths with the actual locations on your system.

3. **Restart GitHub Copilot** to detect the new MCP server.

4. **Invoke the Jira tool** from Copilot chat or command palette by referencing the `get_jira_issues` tool.

> **Note:** This server can also be used with other MCP-compatible tools such as Cursor and Windsurf by following similar configuration steps.

## Development

- **Auto-rebuild on changes:**

  ```bash
  npm run watch
  ```

- **Debugging:**
  Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) for debugging MCP servers:

  ```bash
  npm run inspector
  ```

## License

MIT License
