export class WorkerManager<TMessage = unknown> {
  #worker: Worker | null = null;
  #retryCount = 0;
  #maxRetries: number;
  #retryDefaultDelay: number;
  #workerFactory: (() => Worker) | null = null;
  #handlers: {
    onMessage: (data: TMessage) => void;
    onError?: (error: Event) => void;
  } | null = null;
  #context = '';

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
      onError?: (error: Event) => void;
    },
    context = 'Worker',
  ): void {
    this.terminate();
    this.#workerFactory = factory;
    this.#handlers = handlers;
    this.#context = context;

    try {
      const worker = factory();

      worker.onmessage = (e: MessageEvent<TMessage>) => {
        this.#retryCount = 0;
        handlers.onMessage(e.data);
      };

      worker.onerror = (error) => {
        console.error(`${context} error:`, error);
        handlers.onError?.(error);
        this.terminate();
        this.#retry();
      };

      this.#worker = worker;
    } catch (error) {
      console.error(`Failed to initialize ${context}:`, error);
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

  terminate(): void {
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
  }

  #retry(): void {
    const factory = this.#workerFactory;
    const handlers = this.#handlers;
    if (!factory || !handlers) return;
    if (this.#retryCount < this.#maxRetries) {
      this.#retryCount++;
      setTimeout(() => this.init(factory, handlers, this.#context), this.#retryDefaultDelay * this.#retryCount);
    } else {
      console.error(`Max ${this.#context} retry attempts reached. Giving up.`);
    }
  }
}
