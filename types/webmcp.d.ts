export {};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (...args: unknown[]) => unknown;
      getTools?: () => Promise<unknown>;
    };
  }
}