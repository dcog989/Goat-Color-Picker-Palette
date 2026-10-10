export class ManagedWorker<TMessage = unknown> {
  #worker: Worker | null = null;
  #retryCount = 0;
  #maxRetries: number;
  #retryDefaultDelay: number;
  #workerFactory: (() => Worker) | null = null;
  #handlers: {
    onMessage: (data: TMessage) => void;
    onError?: (error?: Event) => void;
    onReady?: () => void;
  } | null = null;
  #context = "";
  #retryTimer: number | null = null;
  #subscribers: Array<(msg: TMessage) => void> = [];

  constructor(config?: { maxRetries?: number; retryDelay?: number }) {
    this.#maxRetries = config?.maxRetries ?? 0;
    this.#retryDefaultDelay = config?.retryDelay ?? 1000;
  }

  get isActive(): boolean {
    return this.#worker !== null;
  }

  init(
    factory: () => Worker,
    handlers: {
      onMessage: (data: TMessage) => void;
      onError?: (error?: Event) => void;
      onReady?: () => void;
    },
    context = "Worker",
  ): void {
    this.terminate();
    this.#workerFactory = factory;
    this.#handlers = handlers;
    this.#context = context;
    this.#retryCount = 0;

    this.#start();
  }

  #start(): void {
    const factory = this.#workerFactory;
    const handlers = this.#handlers;
    if (!factory || !handlers) return;

    try {
      const worker = factory();

      worker.onmessage = (e: MessageEvent<TMessage>) => {
        this.#retryCount = 0;
        handlers.onMessage(e.data);
        this.#subscribers.forEach((h) => {
          h(e.data);
        });
      };

      worker.onerror = (error) => {
        console.error(`${this.#context} error:`, error);
        handlers.onError?.(error);
        this.terminate();
        this.#retry();
      };

      this.#worker = worker;
      handlers.onReady?.();
    } catch (error) {
      console.error(`Failed to initialize ${this.#context}:`, error);
      handlers.onError?.();
      this.#retry();
    }
  }

  post(data: unknown, transfer?: Transferable[]): void {
    if (!this.#worker) {
      console.warn(`${this.#context} worker not available`);
      return;
    }
    try {
      this.#worker.postMessage(data, transfer ?? []);
    } catch (error) {
      console.error(`Failed to send message to ${this.#context}:`, error);
    }
  }

  subscribe(handler: (msg: TMessage) => void): () => void {
    this.#subscribers.push(handler);
    return () => {
      this.#subscribers = this.#subscribers.filter((h) => h !== handler);
    };
  }

  terminate(): void {
    if (this.#retryTimer !== null) {
      clearTimeout(this.#retryTimer);
      this.#retryTimer = null;
    }
    if (this.#worker) {
      this.#worker.terminate();
      this.#worker = null;
    }
  }

  destroy(): void {
    this.terminate();
    this.#workerFactory = null;
    this.#handlers = null;
    this.#retryCount = 0;
    this.#subscribers = [];
  }

  #retry(): void {
    if (!this.#workerFactory || !this.#handlers) return;
    if (this.#retryCount < this.#maxRetries) {
      this.#retryCount++;
      this.#retryTimer = window.setTimeout(() => {
        this.#retryTimer = null;
        this.#start();
      }, this.#retryDefaultDelay * this.#retryCount);
    } else {
      console.error(`Max ${this.#context} retry attempts reached. Giving up.`);
    }
  }
}
