import { invoke } from "@tauri-apps/api/tauri";
import { Toast, InfoLevel } from "./toast";
import { eventBus } from "../main";

export class SideBar {
    private sidebar: HTMLElement;
    private toggleBtn: HTMLElement;
    private mainInput: HTMLElement;
    private subInput: HTMLElement;
    private filterBtn: HTMLElement;

    constructor(sideNodeId: string) {
        const sideNode = document.getElementById(sideNodeId)!;
        this.sidebar = sideNode.getElementsByClassName('sidebar').item(0) as HTMLElement;
        this.toggleBtn = sideNode.getElementsByClassName('toggle-btn').item(0) as HTMLElement;
        this.mainInput = sideNode.getElementsByClassName('main-input').item(0) as HTMLElement;
        this.subInput = sideNode.getElementsByClassName('sub-input').item(0) as HTMLElement;
        this.filterBtn = sideNode.getElementsByClassName('send-btn').item(0) as HTMLElement;

        this.toggleBtn.addEventListener('pointerup', () => {
            if (this.sidebar.style.transform === 'translateX(-10vw)') {
                this.sidebar.style.transform = 'translateX(0)';
                this.toggleBtn.style.left = '10vw';
            } else {
                this.sidebar.style.transform = 'translateX(-10vw)';
                this.toggleBtn.style.left = '0';
            }
        });

        this.filterBtn.addEventListener('pointerup', async () => {
            await invoke("set_distance", {
                mainId: (this.mainInput as HTMLInputElement).value,
                subId: (this.subInput as HTMLInputElement).value
            })
                .then((msg) => {
                    const toast = new Toast("toast-container");
                    toast.showToast(msg as string, InfoLevel.success);
                    eventBus.invoke("onFilterChanged");
                })
                .catch((err) => {
                    const toast = new Toast("toast-container");
                    toast.showToast(err, InfoLevel.error);
                })
        });
    }
}