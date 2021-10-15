export class Timer {

    private rafId: number | undefined;

    constructor(private readonly fn: (...args: any[]) => any) {
    }

    get isRunning(): boolean {
        return this.rafId !== undefined;
    }

    start(delay: number) {
        this.cancel();

        const start = +new Date();

        const loop = () => {
            if (this.rafId && (+new Date() - start) >= delay) {
                this.rafId = undefined;
                this.fn();
            } else {
                this.rafId = requestAnimationFrame(loop);
            }
        };

        this.rafId = requestAnimationFrame(loop);
    }

    cancel() {
        if (this.rafId !== undefined) {
            cancelAnimationFrame(this.rafId);
        }
        this.rafId = undefined;
    }

}
