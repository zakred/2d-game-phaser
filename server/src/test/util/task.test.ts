import "jest";
import Task from "../../main/util/task";

describe("Task", () => {
    let sut: Task;
    let fnMock: any;
    jest.useFakeTimers();

    beforeEach(() => {
        fnMock = jest.fn();
        sut = new Task(fnMock, 1000);
    });

    it("should have an id", async () => {
        sut = new Task(() => 1, 1);

        const result = sut.getId();

        expect(result.length).toBeGreaterThan(10);
    });

    it("should be able to execute functions after an interval", async () => {
        sut.start();
        jest.advanceTimersByTime(1000);

        expect(fnMock).toBeCalledTimes(1);
    });

    it("should return not running when task is not started", async () => {
        const result = sut.isRunning();

        expect(result).toBeFalsy();
    });

    it("should return running when task is started", async () => {
        sut.start();

        const result = sut.isRunning();

        expect(result).toBeTruthy();
    });

    it("should be able to be stopped", async () => {
        sut.start();
        sut.stop();

        const result = sut.isRunning();

        expect(result).toBeFalsy();
    });

    it("should return the remaining time", async () => {
        sut.start();
        jest.advanceTimersByTime(200);

        const result = sut.getTimeRunning();

        expect(result).toBe(200);
    });

    it("should return the remaining time in multiples of 200", async () => {
        sut.start();

        jest.advanceTimersByTime(300);
        let result = sut.getTimeRunning();
        expect(result).toBe(200);

        jest.advanceTimersByTime(200);
        result = sut.getTimeRunning();
        expect(result).toBe(400);
    });

    it("should reset the remaining time after calling the function", async () => {
        sut.start();
        jest.advanceTimersByTime(1000);

        let result = sut.getTimeRunning();

        expect(result).toBe(0);
    });
});
