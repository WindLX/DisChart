import * as echarts from 'echarts';
import { DistanceSet } from '../model/distance_set';
import { appWindow } from "@tauri-apps/api/window";
import { Config } from '../model/config';
import { subscribe } from '../event';

export class Chart {
    onCountUpdate: ((counts: number[]) => void) | null = null;

    chart: echarts.ECharts;
    options: any;
    time_threshold: number[];
    counts: number[] = [];

    constructor(chartNodeId: string) {
        const chartContainer = document.getElementById(chartNodeId)!;
        const chart = echarts.init(chartContainer);

        const options = {
            title: {
                text: "",
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

        this.time_threshold = [1, 2, 3];

        subscribe((config) => this.changeConfig(config));

        appWindow.listen("tauri://resize", async () => {
            const size = await appWindow.innerSize();
            var screenHeight = window.screen.height;
            const rate_h = screenHeight / 1080;
            this.chart.resize({
                height: size.height * 0.85 * rate_h,
                width: size.width * 0.92 * rate_h
            });
        });
    }

    load_data(data: Array<DistanceSet>) {
        this.chart.clear();
        const distanceSets: Array<DistanceSet> = data;
        let seriesData = [];
        let counts: number[] = distanceSets.map((distance_set) => {
            return distance_set.count;
        });
        this.counts = counts;

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

        if (this.onCountUpdate) {
            this.onCountUpdate(this.findMaxConsecutiveTypes(counts, this.time_threshold));
        }
    }

    clear() {
        this.chart.clear();
        this.options.series = [];
        this.options.xAxis.show = false;
        this.options.yAxis.show = false;
        this.chart.setOption(this.options);
        this.chart.renderToCanvas();
        this.counts = [];
    }

    changeConfig(config: Config) {
        this.options.title.text = config.chart.title;
        this.options.xAxis.name = config.chart.x_axis;
        this.options.yAxis.name = config.chart.y_axis;
        this.chart.setOption(this.options);
        this.chart.renderToCanvas();
        this.time_threshold = config.system.time_threshold;
    }

    findMaxConsecutiveTypes(arr: number[], time_threshold: number[]): number[] {
        const a = time_threshold[0];
        const b = time_threshold[1];
        const c = time_threshold[2];

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
}