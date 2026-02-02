export class ToastStore {
    active = $state<{
        message: string;
        id: number;
        x?: number | undefined;
        y?: number | undefined;
    } | null>(null);
    #counter = 0;

    show(message: string, arg2?: number | MouseEvent | null, arg3: number = 3000) {
        const id = ++this.#counter;
        let duration = arg3;
        let x: number | undefined;
        let y: number | undefined;

        // Overload handling: if arg2 is number, it's duration. If object, it's the event.
        if (typeof arg2 === 'number') {
            duration = arg2;
        } else if (arg2 && typeof arg2 === 'object' && 'clientX' in arg2) {
            x = arg2.clientX;
            y = arg2.clientY;
        }

        this.active = { message, id, x, y };

        setTimeout(() => {
            if (this.active?.id === id) {
                this.active = null;
            }
        }, duration);
    }
}
