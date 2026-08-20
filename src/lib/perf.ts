export function perfEnabled() {
  return process.env.PERF_LOG === "1";
}

export function perfTime(label: string) {
  if (!perfEnabled()) {
    return { end() {} };
  }
  const start = performance.now();
  return {
    end() {
      console.info(`[perf] ${label}: ${Math.round(performance.now() - start)}ms`);
    },
  };
}
