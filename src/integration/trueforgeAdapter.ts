/**
 * ForgePilot — TrueForge SDK Integration Adapter (Member 1)
 *
 * Encapsulates all direct communication with the TrueForge TypeScript SDK.
 * Consumers (M2 UI, M3 Context, M4 Tools) must interact through these functions
 * and ForgePilot internal types, NEVER importing SDK types directly.
 *
 * Verified against: @truefoundry/trueforge-sdk@0.184.1
 */

import { TrueForge, TrueForgeError } from "@truefoundry/trueforge-sdk";
import type { TrueForgeApi } from "@truefoundry/trueforge-sdk";
import { ForgePilotError } from "../utils/errors.js";
import type { AgentEvent, AgentRunOptions, SessionOptions } from "../types.js";

/**
 * Creates a configured TrueForge SDK client.
 */
export function createTrueForgeClient(
  baseUrl: string,
  token?: string,
): TrueForge {
  return new TrueForge({
    baseUrl,
    token,
  });
}

/**
 * A-01: Start a session in TrueForge.
 * Supports either an inline AgentSpec or a pre-registered agent name.
 */
export async function startSession(
  client: TrueForge,
  options: SessionOptions,
): Promise<string> {
  try {
    if (options.agentSpec) {
      const response = await client.sessions.create({
        agent: {
          spec: {
            model: {
              name: options.agentSpec.modelName,
            },
            instructions: options.agentSpec.instructions,
            mcpServers: options.agentSpec.mcpServers?.map((server) => ({
              name: server.name,
              preload: server.preload,
              requireApprovalForTools: server.requireApprovalForTools,
            })),
          },
        },
      });
      return response.data.id;
    }

    if (options.agentName) {
      const response = await client.sessions.create({
        agent: {
          name: options.agentName,
        },
      });
      return response.data.id;
    }

    throw new ForgePilotError(
      "SESSION_ERROR",
      "SessionOptions must include either agentSpec or agentName",
    );
  } catch (error) {
    if (error instanceof ForgePilotError) {
      throw error;
    }
    throw mapTrueForgeError(error);
  }
}

/**
 * Formats user prompt with optional context items into user message text.
 */
function buildTurnPrompt(options: AgentRunOptions): string {
  if (!options.contextItems || options.contextItems.length === 0) {
    return options.prompt;
  }

  const contextBlocks = options.contextItems
    .map((item) => `[Context File: ${item.filePath}]\n${item.content}`)
    .join("\n\n---\n\n");

  return `${options.prompt}\n\nWorkspace Context:\n${contextBlocks}`;
}

/**
 * A-02: Submit a turn to TrueForge and return a streaming event async iterator.
 * Maps raw TrueForge SDK events to normalized ForgePilot AgentEvent objects.
 */
export async function runAgent(
  client: TrueForge,
  sessionId: string,
  options: AgentRunOptions,
): Promise<AsyncIterable<AgentEvent>> {
  try {
    const promptText = buildTurnPrompt(options);
    const stream = await client.sessions.createTurnStream(sessionId, {
      input: [
        {
          type: "user.message",
          content: promptText,
        },
      ],
    });

    return (async function* (): AsyncGenerator<AgentEvent, void, unknown> {
      try {
        for await (const rawEvent of stream) {
          const mapped = normalizeTurnEvent(rawEvent);
          if (mapped) {
            yield mapped;
          }
        }
      } catch (streamError) {
        throw mapTrueForgeError(streamError);
      }
    })();
  } catch (error) {
    if (error instanceof ForgePilotError) {
      throw error;
    }
    throw mapTrueForgeError(error);
  }
}

/**
 * Maps a raw TrueForge TurnStreamingEvent to a normalized AgentEvent.
 */
function normalizeTurnEvent(
  raw: TrueForgeApi.TurnStreamingEvent,
): AgentEvent | null {
  switch (raw.type) {
    case "turn.created":
      return {
        type: "turn.created",
        turnId: raw.turnId,
      };

    case "model.message.delta":
      return {
        type: "text.delta",
        content: raw.content ?? undefined,
      };

    case "mcp.initialize":
      return {
        type: "tool.started",
        toolName: raw.mcpServers.map((s) => s.name).join(", "),
      };

    case "turn.done": {
      if (raw.state.status === "cancelled") {
        return {
          type: "turn.cancelled",
        };
      }
      if (raw.state.status === "error") {
        return {
          type: "turn.error",
          error: raw.state.message || "Turn execution failed",
        };
      }
      let outputText: string | undefined;
      const output = raw.state.output;
      if (output?.content) {
        if (typeof output.content === "string") {
          outputText = output.content;
        } else if (Array.isArray(output.content)) {
          outputText = output.content
            .map((part) =>
              "text" in part && typeof part.text === "string" ? part.text : "",
            )
            .join("");
        }
      }
      return {
        type: "turn.completed",
        content: outputText,
      };
    }

    default:
      return null;
  }
}

/**
 * A-03: Subscribe to streaming events from an AgentEvent iterator.
 * Returns an unsubscribe callback.
 */
export function subscribeToEvents(
  stream: AsyncIterable<AgentEvent>,
  handler: (event: AgentEvent) => void,
): () => void {
  let active = true;

  (async (): Promise<void> => {
    try {
      for await (const event of stream) {
        if (!active) {
          break;
        }
        handler(event);
      }
    } catch (err) {
      if (active) {
        handler({
          type: "turn.error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  })();

  return () => {
    active = false;
  };
}

/**
 * A-04: Interrupt an in-flight model/tool execution.
 */
export async function cancelRun(
  client: TrueForge,
  sessionId: string,
): Promise<void> {
  try {
    await client.sessions.cancel(sessionId);
  } catch (error) {
    throw mapTrueForgeError(error);
  }
}

/**
 * A-05: Delete a session and clean up server resources.
 */
export async function disposeSession(
  client: TrueForge,
  sessionId: string,
): Promise<void> {
  try {
    await client.sessions.delete(sessionId);
  } catch (error) {
    throw mapTrueForgeError(error);
  }
}

/**
 * A-06: Map SDK / HTTP / network errors to typed ForgePilotError.
 */
export function mapTrueForgeError(error: unknown): ForgePilotError {
  if (error instanceof ForgePilotError) {
    return error;
  }

  if (error instanceof TrueForgeError) {
    const status = error.statusCode;
    const msg = error.message || "";

    if (status === 401 || status === 403) {
      return new ForgePilotError(
        "UNAUTHORIZED",
        "Authentication failed with TrueForge server. Please verify your credentials or API key.",
      );
    }

    if (status === 400 && msg.includes("Outbound URL blocked")) {
      return new ForgePilotError(
        "NETWORK_SECURITY",
        `Outbound network security policy blocked destination: ${msg}`,
      );
    }

    if (status === 404) {
      return new ForgePilotError(
        "SESSION_ERROR",
        `Requested TrueForge session or resource not found: ${msg}`,
      );
    }

    if (status === 422) {
      return new ForgePilotError(
        "SESSION_ERROR",
        `TrueForge specification or validation error: ${msg}`,
      );
    }

    if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
      return new ForgePilotError(
        "UNREACHABLE_SERVER",
        "Unable to connect to TrueForge server. Please verify that the server is running.",
      );
    }

    return new ForgePilotError(
      "SESSION_ERROR",
      `TrueForge error (${status || "unknown"}): ${msg}`,
    );
  }

  if (error instanceof Error) {
    if (
      error.message.includes("fetch failed") ||
      error.message.includes("ECONNREFUSED")
    ) {
      return new ForgePilotError(
        "UNREACHABLE_SERVER",
        "Unable to connect to TrueForge server. Please verify that the server is running.",
      );
    }
    return new ForgePilotError("SESSION_ERROR", error.message);
  }

  return new ForgePilotError("SESSION_ERROR", String(error));
}

/**
 * A-07: Health-check TrueForge server and availability.
 */
export async function checkAgentAvailability(
  baseUrl: string,
  token?: string,
): Promise<boolean> {
  try {
    const client = createTrueForgeClient(baseUrl, token);
    await client.agents.list({ limit: 1 });
    return true;
  } catch {
    return false;
  }
}
