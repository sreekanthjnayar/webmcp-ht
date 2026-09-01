import { useArchitectureStore } from "@/lib/store";

export function getStore() {
  return useArchitectureStore.getState();
}

export function json(value: unknown) {
  return value;
}
