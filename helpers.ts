export function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function withRetry<O extends () => Promise<any>>(
  operation: O,
  delay: number,
  retries: number
): ReturnType<O> {
  return new Promise((resolve, reject) => {
    return operation()
      .then(resolve)
      .catch((reason) => {
        if (retries > 0) {
          return wait(delay)
            .then(withRetry.bind(null, operation, delay, retries - 1))
            .then(resolve)
            .catch(reject);
        }

        return reject(reason);
      });
  }) as any;
}

export class Logger {
  constructor(private mod: string) {}

  log(...args: any) {
    console.log(...[`(${this.mod})`, ...args]);
  }
  
  error(...args: any) {
    console.error(...[`(${this.mod})`, ...args]);
  }
}
