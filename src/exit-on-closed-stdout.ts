export function exitOnClosedStdout(): void {
  process.stdout.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code !== "EPIPE") {
      throw error;
    }
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(0);
  });
}
