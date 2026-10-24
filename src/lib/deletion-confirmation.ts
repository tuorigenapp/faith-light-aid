type PendingDeletion = { description: string; scope: string; resolve: (confirmed: boolean) => void };

/** One queue prevents overlapping confirmations and never authorizes a deletion without a mounted host. */
export function createDeletionConfirmation(options: {
  getScope: () => string;
  readPreference: (scope: string) => boolean;
  savePreference: (scope: string) => void;
}) {
  const queue: PendingDeletion[] = [];
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => queue[0] ?? null,
    request(description: string): Promise<boolean> {
      const scope = options.getScope();
      if (options.readPreference(scope)) return Promise.resolve(true);
      return new Promise(resolve => { queue.push({ description, scope, resolve }); notify(); });
    },
    decide(confirmed: boolean, remember = false) {
      const item = queue.shift();
      if (!item) return;
      // Checking the box and cancelling must never disable future confirmations.
      if (confirmed && remember) options.savePreference(item.scope);
      item.resolve(confirmed);
      while (queue[0] && options.readPreference(queue[0].scope)) queue.shift()?.resolve(true);
      notify();
    },
    cancelAll() { queue.splice(0).forEach(item => item.resolve(false)); notify(); },
  };
}

type ConfirmationHandler = (description: string) => Promise<boolean>;
let handler: ConfirmationHandler | null = null;

export function registerDeletionConfirmation(next: ConfirmationHandler) {
  handler = next;
  return () => { if (handler === next) handler = null; };
}

export function confirmDeletion(description = "Este elemento se eliminará de tu cuenta."): Promise<boolean> {
  return handler ? handler(description) : Promise.resolve(false);
}

export const deletionPreferenceKey = (scope: string) => `origen:delete-confirmation:${scope}`;