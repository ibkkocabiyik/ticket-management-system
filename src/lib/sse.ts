// Global SSE emitter — per-user subscriber map
// Uses globalThis to survive Next.js hot reloads in dev mode

type Controller = ReadableStreamDefaultController<Uint8Array>;

declare global {
  // eslint-disable-next-line no-var
  var __sseSubscribers: Map<string, Set<Controller>> | undefined;
}

function getSubscribers(): Map<string, Set<Controller>> {
  if (!globalThis.__sseSubscribers) {
    globalThis.__sseSubscribers = new Map();
  }
  return globalThis.__sseSubscribers;
}

export function addSubscriber(userId: string, controller: Controller) {
  const subscribers = getSubscribers();
  if (!subscribers.has(userId)) {
    subscribers.set(userId, new Set());
  }
  subscribers.get(userId)!.add(controller);
}

export function removeSubscriber(userId: string, controller: Controller) {
  const subscribers = getSubscribers();
  subscribers.get(userId)?.delete(controller);
  if (subscribers.get(userId)?.size === 0) {
    subscribers.delete(userId);
  }
}

export function sendToUser(userId: string, data: Record<string, unknown>) {
  const subscribers = getSubscribers();
  const controllers = subscribers.get(userId);
  if (!controllers || controllers.size === 0) return;

  const encoded = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
  const dead = new Set<Controller>();

  controllers.forEach((ctrl) => {
    try {
      ctrl.enqueue(encoded);
    } catch {
      dead.add(ctrl);
    }
  });

  dead.forEach((ctrl) => {
    controllers.delete(ctrl);
  });
  if (controllers.size === 0) {
    subscribers.delete(userId);
  }
}
