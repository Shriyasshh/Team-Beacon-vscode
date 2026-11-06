import { describe, it, expect, beforeAll } from "vitest";
import http from "node:http";
import fs from "node:fs";
import { TrueForge, TrueForgeError } from "@truefoundry/trueforge-sdk";
import type { TrueForgeApi } from "@truefoundry/trueforge-sdk";
import { ForgePilotError } from "../../src/utils/errors.js";
import {
  checkAgentAvailability,
  createTrueForgeClient,
  disposeSession,
  mapTrueForgeError,
  runAgent,
  startSession,
} from "../../src/integration/trueforgeAdapter.js";
import type { AgentEvent } from "../../src/types.js";

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

      await client.sessions.delete(sessionId);
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
          await client.sessions.cancel(sessionId);
        }
        if (event.type === "turn.done") {
          finalStateStatus = event.state.status;
        }
      }

      expect(cancelled).toBe(true);
      expect(finalStateStatus).toBe("cancelled");

      await client.sessions.delete(sessionId);
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

      await client.settings.mcpServers.delete("test-workspace-mcp");
    });
  });

  describe("6. Network Security & SSRF Outbound Allowlist", () => {
    it("rejects unapproved private IP destination with 400 BadRequestError", async () => {
      try {
        await client.settings.mcpServers.createOrUpdate({
          manifest: {
            name: "test-ssrf-private-ip",
            type: "remote",
            url: "http://10.0.0.1:8080/sse",
            description: "Unapproved private destination",
          },
        });
        expect.unreachable(
          "Should have rejected unapproved outbound destination",
        );
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(TrueForgeError);
        const tfError = err as TrueForgeError;
        expect(tfError.statusCode).toBe(400);
        expect(tfError.message).toContain("Outbound URL blocked for host");
        expect(tfError.message).toContain("10.0.0.1");
      }
    });

    it("rejects unapproved internal domain with 400 BadRequestError", async () => {
      try {
        await client.settings.mcpServers.createOrUpdate({
          manifest: {
            name: "test-ssrf-internal-corp",
            type: "remote",
            url: "http://internal-payroll.corp:8080/sse",
            description: "Unapproved internal domain",
          },
        });
        expect.unreachable("Should have rejected unapproved internal host");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(TrueForgeError);
        const tfError = err as TrueForgeError;
        expect(tfError.statusCode).toBe(400);
        expect(tfError.message).toContain("Outbound URL blocked for host");
        expect(tfError.message).toContain("internal-payroll.corp");
      }
    });

    it("permits registration to allowlisted loopback host", async () => {
      const result = await client.settings.mcpServers.createOrUpdate({
        manifest: {
          name: "test-ssrf-allowed-loopback",
          type: "remote",
          url: "http://[::1]:9155/sse",
          description: "Allowlisted local MCP destination",
        },
      });

      expect(result).toBeDefined();
      expect(result.data.name).toBe("test-ssrf-allowed-loopback");

      await client.settings.mcpServers.delete("test-ssrf-allowed-loopback");
    });

    it("handles unavailable registered MCP server gracefully without crashing", async () => {
      await client.settings.mcpServers.createOrUpdate({
        manifest: {
          name: "test-unavailable-mcp",
          type: "remote",
          url: "http://[::1]:9992/sse",
          description: "Inactive port",
        },
      });

      const session = await client.sessions.create({
        agent: {
          spec: {
            model: { name: "google-gemini/gemini-3-5-flash" },
            instructions: "Respond briefly.",
            mcpServers: [{ name: "test-unavailable-mcp", preload: true }],
          },
        },
      });

      const stream = await client.sessions.createTurnStream(session.data.id, {
        input: [{ type: "user.message", content: "Test ping" }],
      });

      let terminalState: { status: string; message?: string } | undefined;
      for await (const event of stream) {
        if (event.type === "turn.done") {
          terminalState = event.state as { status: string; message?: string };
        }
      }

      expect(terminalState).toBeDefined();
      expect(terminalState?.status).toBe("error");
      expect(terminalState?.message).toContain(
        "Failed to connect to remote MCP server",
      );

      // Clean up
      await client.settings.mcpServers.delete("test-unavailable-mcp");
      await client.sessions.delete(session.data.id);

      // Verify client and server remain fully responsive after error
      const healthCheck = await client.sessions.list({ limit: 1 });
      expect(healthCheck).toBeDefined();
    }, 20_000);
  });

  describe("7. Authentication Resilience & Invalid Credentials", () => {
    it("detects 401 Unauthorized, maps to ForgePilotError, remains responsive, and modifies zero files", async () => {
      // Create a lightweight local HTTP server returning 401
      const mockServer = http.createServer((_req, res) => {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: { message: "Invalid TrueForge authentication token" },
          }),
        );
      });

      await new Promise<void>((resolve) =>
        mockServer.listen(0, "127.0.0.1", () => resolve()),
      );
      const mockPort = (mockServer.address() as { port: number }).port;

      const snapshotBefore = fs.readdirSync(process.cwd());

      try {
        const unauthorizedClient = new TrueForge({
          baseUrl: `http://127.0.0.1:${mockPort}`,
          token: "invalid-expired-token-12345",
        });

        await unauthorizedClient.sessions.list();
        expect.unreachable("Should have failed on 401 response");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(TrueForgeError);
        const mapped = mapTrueForgeError(err);
        expect(mapped).toBeInstanceOf(ForgePilotError);
        expect(mapped.code).toBe("UNAUTHORIZED");
        expect(mapped.message).toContain(
          "Authentication failed with TrueForge server",
        );
      } finally {
        mockServer.close();
      }

      // Verify extension process responsiveness and zero file changes
      const snapshotAfter = fs.readdirSync(process.cwd());
      expect(snapshotAfter).toEqual(snapshotBefore);
    });

    it("handles model provider connection/credential failure cleanly without modifying workspace", async () => {
      // Register custom provider with unreachable endpoint
      await client.settings.modelProviders.createOrUpdate({
        manifest: {
          type: "custom",
          name: "test-unreachable-provider",
          baseUrl: "http://[::1]:9993/v1",
          auth: { apiKey: "fake-key-unreachable" },
          models: [
            {
              modelId: "mock-model",
              name: "mock-model",
              properties: {},
            },
          ],
        },
      });

      const snapshotBefore = fs.readdirSync(process.cwd());

      const session = await client.sessions.create({
        agent: {
          spec: {
            model: { name: "test-unreachable-provider/mock-model" },
            instructions: "Hello",
          },
        },
      });

      const stream = await client.sessions.createTurnStream(session.data.id, {
        input: [{ type: "user.message", content: "ping" }],
      });

      let terminalStatus: string | undefined;
      let terminalMessage: string | undefined;

      for await (const ev of stream) {
        if (ev.type === "turn.done") {
          terminalStatus = ev.state.status;
          terminalMessage = (ev.state as { message?: string }).message;
        }
      }

      expect(terminalStatus).toBe("error");
      expect(terminalMessage).toContain("Cannot connect to API");

      // Clean up provider and session
      await client.settings.modelProviders.delete("test-unreachable-provider");
      await client.sessions.delete(session.data.id);

      // Verify zero file changes
      const snapshotAfter = fs.readdirSync(process.cwd());
      expect(snapshotAfter).toEqual(snapshotBefore);

      // Verify server remains responsive
      const sessionsList = await client.sessions.list({ limit: 1 });
      expect(sessionsList).toBeDefined();
    }, 20_000);
  });

  describe("8. ForgePilot Integration Adapter End-to-End (A-01 to A-07)", () => {
    it("A-07: checkAgentAvailability correctly reports health", async () => {
      const isAvailable = await checkAgentAvailability(TRUEFORGE_SERVER_URL);
      expect(isAvailable).toBe(true);

      const isOffline = await checkAgentAvailability("http://[::1]:9998");
      expect(isOffline).toBe(false);
    });

    it("A-01, A-02, A-04, A-05: full session lifecycle and streaming adapter", async () => {
      const adapterClient = createTrueForgeClient(TRUEFORGE_SERVER_URL);

      // A-01: startSession
      const sessionId = await startSession(adapterClient, {
        agentSpec: {
          modelName: "google-gemini/gemini-3-5-flash",
          instructions: "Reply with the single word 'PONG'.",
        },
      });
      expect(sessionId).toMatch(/^[0-9a-z]{26}$/);

      // A-02: runAgent
      const stream = await runAgent(adapterClient, sessionId, {
        prompt: "PING",
      });

      const receivedEvents: AgentEvent[] = [];
      for await (const event of stream) {
        receivedEvents.push(event);
      }

      const types = receivedEvents.map((e) => e.type);
      expect(types).toContain("turn.created");
      expect(types).toContain("text.delta");
      expect(types).toContain("turn.completed");

      // A-05: disposeSession
      await disposeSession(adapterClient, sessionId);

      // Verify session was deleted
      try {
        await adapterClient.sessions.get(sessionId);
        expect.unreachable("Session should have been deleted");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(TrueForgeError);
        expect((err as TrueForgeError).statusCode).toBe(404);
      }
    }, 30_000);

    it("A-06: mapTrueForgeError maps various error conditions accurately", () => {
      const unreachableErr = new TrueForgeError({
        message: "fetch failed: connect ECONNREFUSED ::1:8795",
      });
      expect(mapTrueForgeError(unreachableErr).code).toBe("UNREACHABLE_SERVER");

      const authErr = new TrueForgeError({
        statusCode: 401,
        message: "Unauthorized",
      });
      expect(mapTrueForgeError(authErr).code).toBe("UNAUTHORIZED");

      const ssrfErr = new TrueForgeError({
        statusCode: 400,
        message: 'Outbound URL blocked for host "10.0.0.1"',
      });
      expect(mapTrueForgeError(ssrfErr).code).toBe("NETWORK_SECURITY");

      const notFoundErr = new TrueForgeError({
        statusCode: 404,
        message: "Session not found",
      });
      expect(mapTrueForgeError(notFoundErr).code).toBe("SESSION_ERROR");
    });
  });
});
