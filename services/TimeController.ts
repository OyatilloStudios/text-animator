type Listener = (time: number) => void;

class TimeController {
    private time: number = 0;
    private listeners: Set<Listener> = new Set();
    public isLocked: boolean = false;

    setTime(t: number) {
        if (this.isLocked) return;
        this.time = t;
        this.notify();
    }

    forceSetTime(t: number) {
        this.time = t;
        this.notify();
    }

    getTime() {
        return this.time;
    }

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.time));
    }
}

export const timeController = new TimeController();