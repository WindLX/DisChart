import { eventBus } from "../main";

export class Warn {
    private lights: HTMLElement[] = [];
    private texts: HTMLElement[] = [];

    constructor(warnNodeId: string) {
        const warnNode = document.getElementById(warnNodeId)!;

        const lights = warnNode.getElementsByTagName("span");
        this.lights.push(lights.item(0) as HTMLElement);
        this.lights.push(lights.item(1) as HTMLElement);
        this.lights.push(lights.item(2) as HTMLElement);

        const texts = warnNode.getElementsByTagName("p");
        this.texts.push(texts.item(0) as HTMLElement);
        this.texts.push(texts.item(1) as HTMLElement);
        this.texts.push(texts.item(2) as HTMLElement);

        eventBus.subscribe("onTimeCountUpdate", {
            handler: (counts) => this.loadCounts(counts)
        });

        eventBus.subscribe("onDataCleared", {
            handler: () => this.loadCounts([0, 0, 0])
        });

        eventBus.subscribe("onConfigUpdate", {
            handler: (config) => {
                this.loadConfig(config.system.warning_color);
                this.loadCounts([0, 0, 0]);
            }
        });
    }

    loadCounts(counts: number[]) {
        this.texts[0].textContent = String(counts[0]);
        this.texts[1].textContent = String(counts[1]);
        this.texts[2].textContent = String(counts[2]);
    }

    loadConfig(color: string[]) {
        this.lights[0].style.backgroundColor = color[0];
        this.lights[1].style.backgroundColor = color[1];
        this.lights[2].style.backgroundColor = color[2];
    }
}