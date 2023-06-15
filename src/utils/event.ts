export interface Handler {
    handler: ((parameters?: any) => void)
}

export class EventBus {
    handlers: Map<string, Array<Handler>> = new Map();

    constructor() { }

    subscribe(eventName: string, handler: Handler) {
        if (this.handlers.get(eventName) == null) {
            this.handlers.set(eventName, new Array());
        }
        this.handlers.get(eventName)?.push(handler);
    }

    invoke(eventName: string, parameters?: any) {
        if (this.handlers.get(eventName) != null) {
            this.handlers.get(eventName)?.forEach((hd) => {
                hd.handler(parameters)
            })
        }
    }
}