import * as ExcelJS from "exceljs";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { open, save } from '@tauri-apps/api/dialog';
import { resourceDir, join, basename } from '@tauri-apps/api/path';
import { readBinaryFile, writeBinaryFile } from '@tauri-apps/api/fs';
import { Config } from "../model/config";
import { DistanceSet } from "../model/distance_set";
import { Toast, InfoLevel } from "./toast";
import { eventBus } from "../main";

export class MenuBar {
    private importDataBtn: HTMLElement;
    private clearDataBtn: HTMLElement;
    private saveDataBtn: HTMLElement;
    private exitBtn: HTMLElement;
    private updateConfigBtn: HTMLElement;

    path: string | null = null;
    worksheet_name: string | null = null;
    count_threshold: Array<number> = [];
    warning_color: Array<string> = [];
    counts: number[] = [];
    distance_threshold: number | null = null;

    constructor(menuNodeId: string) {
        const menuNode = document.getElementById(menuNodeId)!;
        const items = menuNode.getElementsByClassName("submenu-item");
        this.importDataBtn = items.item(0) as HTMLElement;
        this.clearDataBtn = items.item(1) as HTMLElement;
        this.saveDataBtn = items.item(2) as HTMLElement;
        this.exitBtn = items.item(3) as HTMLElement;
        this.updateConfigBtn = items.item(4) as HTMLElement;

        eventBus.subscribe("onConfigUpdate", {
            handler: (config) => {
                this.worksheet_name = (config as Config).excel.worksheet_name;
                this.count_threshold = (config as Config).system.count_threshold;
                this.warning_color = (config as Config).system.warning_color;
                this.distance_threshold = (config as Config).system.distance_threshold;
            }
        });

        eventBus.subscribe("onCountUpdate", {
            handler: (counts) => this.counts = counts
        });

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
                        worksheetName: this.worksheet_name
                    }).then((msg) => {
                        const toast = new Toast("toast-container");
                        toast.showToast(msg as string, InfoLevel.success);
                        eventBus.invoke("onDataChanged");
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
                    eventBus.invoke("onDataCleared");
                })
                .catch((err) => {
                    const toast = new Toast("toast-container");
                    toast.showToast(err, InfoLevel.error);
                });
        });

        this.saveDataBtn.addEventListener("pointerup", async () => {
            if (!this.path) {
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
                    let counts = this.counts;
                    let res = counts.map((value) => {
                        if (value >= this.count_threshold[2]) {
                            return this.warning_color[2]
                        } else if (value >= this.count_threshold[1]) {
                            return this.warning_color[1]
                        } else if (value >= this.count_threshold[0]!) {
                            return this.warning_color[0]
                        } else {
                            return "none"
                        }
                    });

                    await invoke("get_distance", {
                        distanceThreshold: this.distance_threshold,
                        is3d: true
                    }).then(async (data) => {
                        let data_3d = data as DistanceSet[];

                        await invoke("get_distance", {
                            distanceThreshold: this.distance_threshold,
                            is3d: false
                        }).then(async (data) => {
                            let data_2d = data as DistanceSet[];

                            await writeExcel(this.path!, this.worksheet_name!, filePath, res, data_2d, data_3d).then(() => {
                                const toast = new Toast("toast-container");
                                toast.showToast("Save File Successfully!", InfoLevel.success);
                            }).catch((err) => {
                                console.log(err);
                                const toast = new Toast("toast-container");
                                toast.showToast(err, InfoLevel.error);
                            });

                        }).catch((error) => {
                            const toast = new Toast("toast-container");
                            toast.showToast(error, InfoLevel.error);
                        });

                    }).catch((error) => {
                        const toast = new Toast("toast-container");
                        toast.showToast(error, InfoLevel.error);
                    });
                }
            }
        });

        this.exitBtn.addEventListener("pointerup", async () => {
            appWindow.close();
        });

        this.updateConfigBtn.addEventListener("pointerup", async () => {
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
    }
}

async function writeExcel(readPath: string, worksheetName: string, savePath: string, colors: string[], data_2d: DistanceSet[], data_3d: DistanceSet[]) {
    const resourceDirPath = await resourceDir();
    let filePath = await join(resourceDirPath, 'resources');
    filePath = await join(filePath, 'temp');
    filePath = await join(filePath, await basename(readPath));

    let data = data_2d.map((value, index) => [value, data_3d[index]]);
    const file = await readBinaryFile(filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file);
    let worksheet = workbook.getWorksheet(worksheetName);

    const d_example = data[0][0].distances;

    for (let index = 0; index < d_example.length; index++) {
        const idx_1 = 9 + d_example[index][0] * 5 + index * 2;
        const idx_2 = 10 + d_example[index][0] * 5 + index * 2;
        worksheet.spliceColumns(idx_1, 0, []);
        worksheet.spliceColumns(idx_2, 0, []);
    }

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber == 1) {
            data[0].forEach((d_d, idx_d) => {
                d_d.distances.forEach((d_p, idx_p) => {
                    const idx = 9 + idx_p * 2 + d_p[0] * 5 + idx_d;
                    row.getCell(idx).value = `distance_${idx_d + 2}d, main_id: ${data[0][0].main_point_id}`;
                })
            });
        } else if (rowNumber > 1) {
            const cell = row.getCell(3);
            const color = colors[rowNumber - 2];

            if (color !== 'none') {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: convertColorToHex(color) },
                };
            }

            data[rowNumber - 2].forEach((d_d, idx_d) => {
                d_d.distances.forEach((d_p, idx_p) => {
                    const idx = 9 + idx_p * 2 + d_p[0] * 5 + idx_d;
                    row.getCell(idx).value = d_p[1];
                })
            });
        };
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