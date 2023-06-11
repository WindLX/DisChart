export class DistanceSet {
    main_point_id: number;
    distances: Array<[number, number]>;
    count: number;

    constructor(main_point_id: number, distances: [number, number][], count: number) {
        this.main_point_id = main_point_id;
        this.distances = distances;
        this.count = count;
    }
}
