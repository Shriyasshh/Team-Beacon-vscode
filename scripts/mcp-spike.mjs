import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import http from "node:http";
import { TrueForge } from "@truefoundry/trueforge-sdk";

// 1. Initialize MCP Server
const mcpServer = new McpServer({
  name: "forgepilot-test-server",
  version: "1.0.0"
});

// Register a read-only tool
mcpServer.tool(
  "get_forgepilot_version",
  "Returns the current version of ForgePilot extension and test status.",
  {},
  async () => {
    console.log(">>> [MCP Server] Tool get_forgepilot_version invoked by TrueForge agent!");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ version: "0.0.1", status: "verified", harness: "TrueForge v0.184.1" })
        }
      ]
    };
  }
);

// Map of active transports
const transports = new Map();

// HTTP server for MCP
const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === "/sse") {
    console.log(">>> [MCP Server] Incoming SSE connection from TrueForge");
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    res.on("close", () => {
      transports.delete(transport.sessionId);
    });
    await mcpServer.connect(transport);
  } else if (url.pathname === "/messages") {
    const sessionId = url.searchParams.get("sessionId");
    const transport = transports.get(sessionId);
    if (!transport) {
      res.writeHead(404).end("Session not found");
      return;
    }
    await transport.handlePostMessage(req, res);
  } else {
    res.writeHead(404).end("Not found");
  }
});

const MCP_PORT = 9150;
httpServer.listen(MCP_PORT, "::1", async () => {
  console.log(`MCP server listening on http://[::1]:${MCP_PORT}/sse`);

  const client = new TrueForge({ baseUrl: "http://[::1]:8795" });

  try {
    // 2. Register MCP server in TrueForge
    console.log("Registering MCP server in TrueForge settings...");
    await client.settings.mcpServers.createOrUpdate({
      manifest: {
        name: "forgepilot-test-tools",
        type: "remote",
        url: `http://[::1]:${MCP_PORT}/sse`,
        description: "ForgePilot test tools MCP server"
      }
    });
    console.log("MCP server registered successfully!");

    // 3. Create Session with attached MCP server
    console.log("Creating session with MCP server attached...");
    const session = await client.sessions.create({
      agent: {
        spec: {
          model: {
            name: "google-gemini/gemini-3-5-flash"
          },
          instructions: "You have access to the forgepilot-test-tools MCP server. When asked about ForgePilot version, you MUST use the get_forgepilot_version tool.",
          mcpServers: [
            {
              name: "forgepilot-test-tools",
              preload: true
            }
          ]
        }
      }
    });

    const sessionId = session.data.id;
    console.log("Session created with ID:", sessionId);

    // 4. Submit Turn
    console.log("Submitting turn to trigger tool invocation...");
    const stream = await client.sessions.createTurnStream(sessionId, {
      input: [
        {
          type: "user.message",
          content: "Please check the ForgePilot version using your tool and tell me what version it is."
        }
      ]
    });

    // 5. Consume Stream Events
    for await (const event of stream) {
      if (event.type === "model.message.delta") {
        process.stdout.write(event.content || "");
      } else if (event.type === "turn.done") {
        console.log("\n[Turn Done State]:", JSON.stringify(event.state, null, 2));
      } else {
        console.log("\n[Event]:", event.type);
      }
    }

    console.log("\n>>> MCP Tool Invocation Spike COMPLETE!");
  } catch (err) {
    console.error("Error during MCP spike:", err);
  } finally {
    httpServer.close();
  }
});
