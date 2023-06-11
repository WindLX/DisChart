import { invoke } from "@tauri-apps/api/tauri";
import { Toast, InfoLevel } from "./controller/toast";
import { Config } from "./model/config";

let onConfigUpdated: Array<((config: Config) => void)> | null = null;

export async function loadConfig() {
    await invoke("update_config")
    .then((d) => {
        const toast = new Toast("toast-container");
        toast.showToast("Update Config Successfully!", InfoLevel.success);
        if (onConfigUpdated) {
            onConfigUpdated.forEach(event => {
                event(d as Config)
            });
        }
    })
    .catch((err) => {
        const toast = new Toast("toast-container");
        toast.showToast(err, InfoLevel.error);
    })
}

export function subscribe(func: (config: Config) => void) {
    if (!onConfigUpdated) {
        onConfigUpdated = []
    }
    onConfigUpdated?.push(func)
}