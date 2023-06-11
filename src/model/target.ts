class TargetPointId {
    mainPointId: number;
    otherPointId: number[];

    constructor(mainPointId: number, otherPointid: number[]) {
        this.mainPointId = mainPointId;
        this.otherPointId = otherPointid;
    }
}