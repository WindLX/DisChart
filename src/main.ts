import { MenuBar } from "./controller/menubar";
import { SideBar } from "./controller/sidebar";
import { Chart } from "./controller/chart";
import { Warn } from "./controller/warn";
import { Toast, InfoLevel } from "./controller/toast";
import { EventBus } from "./utils/event";
import { Config } from "./model/config";
import { DistanceSet } from "./model/distance_set";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";

export let eventBus: EventBus = new EventBus();

let config: Config | null = null;

let sign_1: boolean = false;
let sign_2: boolean = false;

let is_3d: boolean = false;

window.addEventListener("DOMContentLoaded", async () => {
  new MenuBar("menubar");
  new SideBar("main");
  new Chart("chart");
  new Warn("warn");

  eventBus.subscribe("onConfigUpdate", {
    handler: async (c) => {
      config = c as Config;
      await appWindow.setTitle(config.window.title);
      let title = document.querySelector("#title") as HTMLElement;
      title.textContent = config.window.title;
      sign_1 = false;
      sign_2 = false;
    }
  });

  eventBus.subscribe("onDataCleared", {
    handler: () => {
      sign_1 = false;
      sign_2 = false;
    }
  });

  eventBus.subscribe("onDataChanged", {
    handler: async () => {
      sign_1 = true;
      await getDistance(is_3d);
    }
  });

  eventBus.subscribe("onFilterChanged", {
    handler: async (is3d) => {
      sign_2 = true;
      is_3d = is3d;
      await getDistance(is_3d);
    }
  });

  await invoke("update_config")
    .then((d) => {
      const toast = new Toast("toast-container");
      toast.showToast("Update Config Successfully!", InfoLevel.success);
      eventBus.invoke("onConfigUpdate", d);
    })
    .catch((err) => {
      const toast = new Toast("toast-container");
      toast.showToast(err, InfoLevel.error);
    })
});

async function getDistance(is3d: boolean) {
  if (sign_1 && sign_2) {
    await invoke("get_distance", {
      distanceThreshold: config?.system.distance_threshold,
      is3d: is3d
    })
      .then((data) => {
        eventBus.invoke("onDistanceUpdate", data as DistanceSet[]);
      }).catch((error) => {
        const toast = new Toast("toast-container");
        toast.showToast(error, InfoLevel.error);
      });
  }
}