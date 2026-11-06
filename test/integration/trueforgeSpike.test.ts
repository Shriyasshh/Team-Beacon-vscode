import { describe, it, expect, beforeAll } from "vitest";
import { TrueForge, TrueForgeError } from "@truefoundry/trueforge-sdk";
import type { TrueForgeApi } from "@truefoundry/trueforge-sdk";

const TRUEFORGE_SERVER_URL =
  process.env.TRUEFORGE_BASE_URL || "http://[::1]:8795";

describe("TrueForge SDK Verified Integration Spike", () => {
  let client: TrueForge;

  beforeAll(() => {
    client = new TrueForge({ baseUrl: TRUEFORGE_SERVER_URL });
  });

  describe("1. Error Handling and Resilience", () => {
    it("handles unreachable server gracefully with typed TrueForgeError", async () => {
      const unreachableClient = new TrueForge({ baseUrl: "http://[::1]:9999" });
      try {
        await unreachableClient.sessions.list();
        expect.unreachable("Should have thrown on unreachable server");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(TrueForgeError);
        expect((err as TrueForgeError).message).toContain("fetch failed");
      }
    });

    it("handles non-existent session with 404 NotFoundError", async () => {
      try {
        await client.sessions.get("non-existent-session-00000");
        expect.unreachable("Should have thrown 404");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(TrueForgeError);
        expect((err as TrueForgeError).statusCode).toBe(404);
        expect((err as TrueForgeError).name).toBe("NotFoundError");
      }
    });
  });

  describe("2. Session Creation with Verified AgentSpec", () => {
    it("creates an inline session with model FQN", async () => {
      const response = await client.sessions.create({
        agent: {
          spec: {
            model: {
              name: "google-gemini/gemini-3-5-flash",
            },
            instructions: "You are a test assistant. Answer in one word.",
          },
        },
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.id).toMatch(/^[0-9a-z]{26}$/); // Monotonic ULID format
      expect(response.data.agent.type).toBe("inline");
    });
  });

  describe("3. Streaming Turn Execution", () => {
    it("executes a turn and streams normalized events through completion", async () => {
      // Create dedicated session
      const session = await client.sessions.create({
        agent: {
          spec: {
            model: {
              name: "google-gemini/gemini-3-5-flash",
            },
            instructions: "Answer in one word.",
          },
        },
      });
      const sessionId = session.data.id;

      const stream = await client.sessions.createTurnStream(sessionId, {
        input: [
          {
            type: "user.message",
            content: "What is 1 + 1?",
          },
        ],
      });

      const eventTypes: string[] = [];
      let turnDoneReceived = false;
      let streamedText = "";

      for await (const event of stream) {
        eventTypes.push(event.type);
        if (event.type === "model.message.delta") {
          streamedText += event.content || "";
        }
        if (event.type === "turn.done") {
          turnDoneReceived = true;
          expect(event.state).toBeDefined();
          expect(["done", "error"]).toContain(event.state.status);
        }
      }

      expect(eventTypes).toContain("turn.created");
      expect(turnDoneReceived).toBe(true);
      expect(streamedText.length).toBeGreaterThan(0);
    }, 30_000);
  });

  describe("4. Turn Cancellation", () => {
    it("cancels a running turn and emits state.status = cancelled", async () => {
      const session = await client.sessions.create({
        agent: {
          spec: {
            model: {
              name: "google-gemini/gemini-3-5-flash",
            },
            instructions: "Write a 500-word essay about trees.",
          },
        },
      });
      const sessionId = session.data.id;

      const stream = await client.sessions.createTurnStream(sessionId, {
        input: [
          {
            type: "user.message",
            content: "Write the essay now.",
          },
        ],
      });

      let cancelled = false;
      let finalStateStatus: string | undefined;

      for await (const event of stream) {
        if (event.type === "turn.created" && !cancelled) {
          cancelled = true;
          // Trigger cancellation once turn has been created
          await client.sessions.cancel(sessionId);
        }
        if (event.type === "turn.done") {
          finalStateStatus = event.state.status;
        }
      }

      expect(cancelled).toBe(true);
      expect(finalStateStatus).toBe("cancelled");
    }, 30_000);
  });

  describe("5. MCP Server Registration Contract", () => {
    it("registers a remote MCP server manifest in TrueForge settings", async () => {
      const mcpManifest: TrueForgeApi.RemoteMcpServerManifest = {
        name: "test-workspace-mcp",
        type: "remote",
        url: "http://[::1]:9150/sse",
        description: "Integration test MCP server",
      };

      const result = await client.settings.mcpServers.createOrUpdate({
        manifest: mcpManifest,
      });

      expect(result).toBeDefined();
      expect(result.data.name).toBe("test-workspace-mcp");
      expect(result.data.manifest.type).toBe("remote");

      // Clean up test registration
      await client.settings.mcpServers.delete("test-workspace-mcp");
    });
  });
});
