import { MenuBar } from "./controller/menubar";
import { SideBar } from "./controller/sidebar";
import { Chart } from "./controller/chart";
import { Warn } from "./controller/warn";
import { invoke } from "@tauri-apps/api/tauri";
import { Toast, InfoLevel } from "./controller/toast";
import { DistanceSet } from "./model/distance_set";
import { appWindow } from "@tauri-apps/api/window";
import { subscribe, loadConfig } from "./event";
import { save } from "@tauri-apps/api/dialog";
import { resourceDir, join, basename } from '@tauri-apps/api/path';
import { readBinaryFile, writeBinaryFile } from '@tauri-apps/api/fs';
import * as ExcelJS from "exceljs";

let menuController: MenuBar;
let sideController: SideBar;
let chartController: Chart;
let warnController: Warn;
let sign_1: boolean = false;
let sign_2: boolean = false;
let distanceThreshold: number;

window.addEventListener("DOMContentLoaded", async () => {
  menuController = new MenuBar("menubar");
  sideController = new SideBar("main");
  chartController = new Chart("chart");
  warnController = new Warn("warn");

  menuController.onDataChanged = async () => {
    sign_1 = true;
    await getDistance(menuController.config?.system.is_3d!);
  };
  menuController.onDataCleared = () => {
    sign_1 = false;
    sign_2 = false;
    chartController.clear();
    warnController.loadCounts([0, 0, 0]);
  };

  sideController.onDataChanged = async () => {
    sign_2 = true;
    await getDistance(menuController.config?.system.is_3d!);
  };

  chartController.onCountUpdate = (counts) => {
    warnController.loadCounts(counts);
  };

  subscribe(async (config) => {
    await appWindow.setTitle(config.window.title);
    let title = document.querySelector("#title") as HTMLElement;
    title.textContent = config.window.title;
    distanceThreshold = config.system.distance_threshold;
    warnController.loadConfig(config.system.warning_color);
    sign_1 = false;
    sign_2 = false;
    chartController.clear();
    warnController.loadCounts([0, 0, 0]);
  });

  menuController.saveDataBtn.addEventListener("pointerup", async () => {
    if (!menuController.path) {
      const toast = new Toast("toast-container");
      toast.showToast("Data is empty, please load data file first", InfoLevel.error);
    } else {
      const filePath = await save({
        filters: [{
          name: 'Data',
          extensions: ['xlsx']
        }]
      });
      if (filePath != null) {
        let counts = chartController.counts;
        let res = counts.map((value) => {
          if (value >= menuController.config?.system.count_threshold[2]!) {
            return menuController.config?.system.warning_color[2]!
          } else if (value >= menuController.config?.system.count_threshold[1]!) {
            return menuController.config?.system.warning_color[1]!
          } else if (value >= menuController.config?.system.count_threshold[0]!) {
            return menuController.config?.system.warning_color[0]!
          } else {
            return "none"
          }
        });
        await writeExcel(menuController.path, menuController.config?.excel.worksheet_name!, filePath, res).then(() => {
          const toast = new Toast("toast-container");
          toast.showToast("Save File Successfully!", InfoLevel.success);
        }).catch((err) => {
          console.log(err);
          const toast = new Toast("toast-container");
          toast.showToast(err, InfoLevel.error);
        });
      }
    }
  });

  await loadConfig();
});

async function getDistance(is3d: boolean) {
  if (sign_1 && sign_2) {
    await invoke("get_distance", {
      distanceThreshold: distanceThreshold,
      is3d: is3d
    })
      .then((data) => {
        chartController.load_data(data as DistanceSet[]);
      }).catch((error) => {
        const toast = new Toast("toast-container");
        toast.showToast(error, InfoLevel.error);
      });
  }
}

async function writeExcel(readPath: string, worksheetName: string, savePath: string, colors: string[]) {
  const resourceDirPath = await resourceDir();
  let filePath = await join(resourceDirPath, 'resources');
  filePath = await join(filePath, 'temp');
  filePath = await join(filePath, await basename(readPath));

  const file = await readBinaryFile(filePath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file);
  const worksheet = workbook.getWorksheet(worksheetName);

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) {
      const cell = row.getCell(3);
      const color = colors[rowNumber - 2];

      if (color !== 'none') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: convertColorToHex(color) },
        };
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  await writeBinaryFile(savePath, buffer);
}

function convertColorToHex(color: string): string {
  let hexColor: string;

  switch (color.toLowerCase()) {
    case 'red':
      hexColor = 'FFFF0000';
      break;
    case 'green':
      hexColor = 'FF00FF00';
      break;
    case 'yellow':
      hexColor = 'FFFFFF00';
      break;
    case 'blue':
      hexColor = 'FF0000FF';
      break;
    default:
      hexColor = 'FF' + color.substring(1);
  }

  return hexColor;
}