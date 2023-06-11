export class Toast {
    node: HTMLElement;
    message: string | null;

    constructor(nodeId: string) {
        this.node = document.getElementById(nodeId)!;
        this.message = null;
    }

    showToast(message: string, infoLevel: InfoLevel) {
        this.message = message;
        this.renderToast(infoLevel);
        setTimeout(() => {
            this.hideToast();
        }, 2000);
    }

    renderToast(infoLevel: InfoLevel) {
        if (!this.message) return;

        const toastElement = document.createElement("div");
        toastElement.classList.add("toast");
        toastElement.textContent = this.message;
        toastElement.style.backgroundColor = get_color(infoLevel);
        this.node.appendChild(toastElement);
    }

    hideToast() {
        const toastElement = this.node.querySelector(".toast");
        if (!toastElement) return;

        toastElement.classList.add("slide-out");

        setTimeout(() => {
            this.removeToast();
        }, 301);
    }

    removeToast() {
        const toastElement = this.node.querySelector(".toast");
        if (toastElement) {
            this.node.removeChild(toastElement);
        }

        this.message = null;
    }
}

export enum InfoLevel {
    error,
    info,
    success
}

function get_color(infoLevel: InfoLevel): string {
    switch (infoLevel) {
        case InfoLevel.error:
            return "#c50202";
        case InfoLevel.info:
            return "#025dc5";
        case InfoLevel.success:
            return "#00a508";
    }
}