import * as echarts from 'echarts';
import { appWindow } from "@tauri-apps/api/window";
import { DistanceSet } from '../model/distance_set';
import { Config } from '../model/config';
import { eventBus } from '../main';

export class Chart {
    chart: echarts.ECharts;
    options: any;
    count_threshold: number[];

    constructor(chartNodeId: string) {
        const chartContainer = document.getElementById(chartNodeId)!;
        const chart = echarts.init(chartContainer);

        const options: echarts.EChartsOption = {
            title: {
                text: "",
                top: "3%",
                left: "center"
            },
            xAxis: {
                type: "category",
                name: "",
                show: false,
            },
            yAxis: {
                name: "",
                show: false,
            },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 0,
                top: 30,
                bottom: 30
            },
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    start: 0,
                    end: 100
                }
            ],
            tooltip: {
                trigger: 'item',
            },
            series: [

            ],
        };

        this.options = options;

        chart.setOption(this.options);
        chart.renderToCanvas();
        this.chart = chart;

        this.count_threshold = [1, 2, 3];

        eventBus.subscribe("onConfigUpdate", {
            handler: (config) => {
                this.changeConfig(config);
                this.clear();
            }
        });

        eventBus.subscribe("onDataCleared", {
            handler: () => this.clear()
        });

        eventBus.subscribe("onDistanceUpdate", {
            handler: (data) => this.load_data(data)
        });

        appWindow.listen("tauri://resize", async () => {
            this.chart.resize();
        });
    }

    load_data(data: Array<DistanceSet>) {
        this.chart.clear();
        const distanceSets: Array<DistanceSet> = data;
        let seriesData = [];
        let counts: number[] = distanceSets.map((distance_set) => {
            return distance_set.count;
        });

        for (let index = 0; index < distanceSets[0].distances.length; index++) {
            const data = {
                name: `${distanceSets[0].main_point_id}-${distanceSets[0].distances[index][0]}`,
                type: 'line',
                data: distanceSets.map((distance_set) => {
                    return distance_set.distances[index][1];
                })
            };
            seriesData.push(data);
        }

        this.options.xAxis.data = Array.from({ length: distanceSets.length }, (_, index) => index + 1);
        this.options.xAxis.show = true;
        this.options.yAxis.show = true;
        this.options.series = seriesData;
        this.chart.setOption(this.options);
        this.chart.renderToCanvas();

        eventBus.invoke("onCountUpdate", counts);
        eventBus.invoke("onTimeCountUpdate", findMaxConsecutiveTypes(counts, this.count_threshold));
    }

    clear() {
        this.chart.clear();
        this.options.series = [];
        this.options.xAxis.show = false;
        this.options.yAxis.show = false;
        this.chart.setOption(this.options);
        this.chart.renderToCanvas();
    }

    changeConfig(config: Config) {
        this.options.title.text = config.chart.title;
        this.options.xAxis.name = config.chart.x_axis;
        this.options.yAxis.name = config.chart.y_axis;
        this.chart.setOption(this.options);
        this.chart.renderToCanvas();
        this.count_threshold = config.system.count_threshold;
    }
}

function findMaxConsecutiveTypes(arr: number[], count_threshold: number[]): number[] {
    const a = count_threshold[0];
    const b = count_threshold[1];
    const c = count_threshold[2];

    let maxConsecutiveCounts: number[] = [0, 0, 0];
    let currentCounts: number[] = [0, 0, 0];

    for (let i = 0; i < arr.length; i++) {
        const num = arr[i];

        if (num >= a && num < b) {
            currentCounts = [currentCounts[0] + 1, 0, 0];
        } else if (num >= b && num < c) {
            currentCounts = [0, currentCounts[1] + 1, 0];
        } else if (num >= c) {
            currentCounts = [0, 0, currentCounts[2] + 1];
        } else {
            currentCounts = [0, 0, 0];
        }

        for (let j = 0; j < 3; j++) {
            if (currentCounts[j] > maxConsecutiveCounts[j]) {
                maxConsecutiveCounts[j] = currentCounts[j];
            }
        }
    }

    return maxConsecutiveCounts;
}