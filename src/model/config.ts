export class Config {
    window: {
        title: string
    }
    system: {
        distance_threshold: number
        count_threshold: Array<number>
        warning_color: Array<string>
    }
    excel: {
        worksheet_name: string,
    }
    chart: {
        title: string,
        y_axis: string,
        x_axis: string
    }

    constructor() {
        this.window = {
            title: ""
        };
        this.system = {
            distance_threshold: 2.0,
            count_threshold: [1, 2, 3],
            warning_color: ["green", "yellow", "red"],
        }
        this.excel = {
            worksheet_name: ""
        };
        this.chart = {
            title: "",
            y_axis: "",
            x_axis: "",
        }
    }
}