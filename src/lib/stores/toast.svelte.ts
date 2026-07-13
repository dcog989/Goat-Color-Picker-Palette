export class ToastStore {
  active = $state<{
    message: string;
    id: number;
    x?: number | undefined;
    y?: number | undefined;
  } | null>(null);
  #counter = 0;

  show(message: string, duration: number = 3000) {
    this.#emit(message, undefined, duration);
  }

  showAt(message: string, event: MouseEvent | undefined, duration: number = 3000) {
    this.#emit(message, event, duration);
  }

  #emit(message: string, event?: MouseEvent, duration: number = 3000) {
    const id = ++this.#counter;

    this.active = {
      message,
      id,
      x: event?.clientX,
      y: event?.clientY,
    };

    setTimeout(() => {
      if (this.active?.id === id) {
        this.active = null;
      }
    }, duration);
  }
}
