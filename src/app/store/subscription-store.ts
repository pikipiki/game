/** Abonnement type React 18+ (`useSyncExternalStore`). */
export type StoreListener = () => void;

export interface SubscriptionStore<Snapshot> {
  getSnapshot: () => Snapshot;
  subscribe: (listener: StoreListener) => () => void;
}

export function createSubscriptionStore<Snapshot>(
  readSnapshot: () => Snapshot,
  onSubscribe?: (listener: StoreListener) => () => void,
): SubscriptionStore<Snapshot> {
  return {
    getSnapshot: readSnapshot,
    subscribe: (listener) => onSubscribe?.(listener) ?? (() => {}),
  };
}
