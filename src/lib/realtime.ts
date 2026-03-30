type StreamController = ReadableStreamDefaultController<Uint8Array>;

type RealtimeState = {
  encoder: TextEncoder;
  userStreams: Map<string, Map<string, StreamController>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __chatRealtimeState: RealtimeState | undefined;
}

const getState = (): RealtimeState => {
  if (!globalThis.__chatRealtimeState) {
    globalThis.__chatRealtimeState = {
      encoder: new TextEncoder(),
      userStreams: new Map(),
    };
  }

  return globalThis.__chatRealtimeState;
};

const writeEvent = (controller: StreamController, event: string, payload: unknown) => {
  const state = getState();
  const body = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  controller.enqueue(state.encoder.encode(body));
};

const closeController = (controller: StreamController) => {
  try {
    controller.close();
  } catch {
    // Stream may already be closed by the runtime.
  }
};

export const subscribeUserStream = (userId: string, controller: StreamController) => {
  const state = getState();
  const connectionId = crypto.randomUUID();
  const existing = state.userStreams.get(userId) ?? new Map<string, StreamController>();
  existing.set(connectionId, controller);
  state.userStreams.set(userId, existing);
  return connectionId;
};

export const removeUserStream = (userId: string, connectionId: string) => {
  const state = getState();
  const userConnections = state.userStreams.get(userId);
  if (!userConnections) return;

  const controller = userConnections.get(connectionId);
  if (controller) {
    closeController(controller);
  }

  userConnections.delete(connectionId);
  if (userConnections.size === 0) {
    state.userStreams.delete(userId);
  }
};

export const hasActiveRealtimeConnection = (userId: string) => {
  const state = getState();
  const userConnections = state.userStreams.get(userId);
  return Boolean(userConnections && userConnections.size > 0);
};

export const sendRealtimeEvent = (userId: string, event: string, payload: unknown) => {
  const state = getState();
  const userConnections = state.userStreams.get(userId);
  if (!userConnections?.size) return 0;

  let delivered = 0;
  for (const [connectionId, controller] of userConnections.entries()) {
    try {
      writeEvent(controller, event, payload);
      delivered += 1;
    } catch {
      userConnections.delete(connectionId);
      closeController(controller);
    }
  }

  if (userConnections.size === 0) {
    state.userStreams.delete(userId);
  }

  return delivered;
};

export const publishToUsers = (
  userIds: string[],
  event: string,
  payload: unknown,
  opts?: { excludeUserIds?: string[] }
) => {
  const seen = new Set<string>();
  const excluded = new Set((opts?.excludeUserIds ?? []).filter(Boolean));

  for (const userId of userIds) {
    if (!userId || seen.has(userId) || excluded.has(userId)) continue;
    seen.add(userId);
    sendRealtimeEvent(userId, event, payload);
  }
};

export const publishToAllConnectedUsers = (
  event: string,
  payload: unknown,
  opts?: { excludeUserIds?: string[] }
) => {
  const state = getState();
  publishToUsers(Array.from(state.userStreams.keys()), event, payload, opts);
};

