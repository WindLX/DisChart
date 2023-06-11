import { invoke } from "@tauri-apps/api/tauri";
import { Toast, InfoLevel } from "./toast";
import { appWindow } from "@tauri-apps/api/window";
import { open } from '@tauri-apps/api/dialog';
import { Config } from "../model/config";
import { loadConfig, subscribe } from "../event";

export class MenuBar {
    onDataChanged: (() => void) | null = null;
    onDataCleared: (() => void) | null = null;

    private importDataBtn: HTMLElement;
    private clearDataBtn: HTMLElement;
    saveDataBtn: HTMLElement;
    private exitBtn: HTMLElement;
    private updateConfigBtn: HTMLElement;

    path: string | null = null;
    config: Config | null = null;

    constructor(menuNodeId: string) {
        const menuNode = document.getElementById(menuNodeId)!;
        const items = menuNode.getElementsByClassName("submenu-item");
        this.importDataBtn = items.item(0) as HTMLElement;
        this.clearDataBtn = items.item(1) as HTMLElement;
        this.saveDataBtn = items.item(2) as HTMLElement;
        this.exitBtn = items.item(3) as HTMLElement;
        this.updateConfigBtn = items.item(4) as HTMLElement;

        subscribe((config) => this.config = config);

        this.importDataBtn.addEventListener("pointerup", async () => {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Data',
                    extensions: ['xlsx']
                }]
            });
            if (selected !== null) {
                this.path = selected as string;
                await invoke("load_data",
                    {
                        path: selected,
                        worksheetName: this.config?.excel.worksheet_name
                    }).then((msg) => {
                        const toast = new Toast("toast-container");
                        toast.showToast(msg as string, InfoLevel.success);
                        if (this.onDataChanged) {
                            this.onDataChanged();
                        }
                    }).catch((error) => {
                        const toast = new Toast("toast-container");
                        toast.showToast(error, InfoLevel.error);
                    });
            }
        });

        this.clearDataBtn.addEventListener("pointerup", async () => {
            await invoke("clear_data")
                .then((msg) => {
                    const toast = new Toast("toast-container");
                    toast.showToast(msg as string, InfoLevel.success);
                    this.path = null;
                    if (this.onDataCleared) {
                        this.onDataCleared();
                    }
                })
                .catch((err) => {
                    const toast = new Toast("toast-container");
                    toast.showToast(err, InfoLevel.error);
                })
        });

        this.exitBtn.addEventListener("pointerup", async () => {
            appWindow.close();
        });

        this.updateConfigBtn.addEventListener("pointerup", async () => {
            await loadConfig()
        });
    }
}