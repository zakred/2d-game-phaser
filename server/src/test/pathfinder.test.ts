import "jest";
import Pathfinder from "../main/pathfinder";

describe("Pathfinder", () => {
    let sut: Pathfinder;
    const board = [
        [true, false, true, true, true],
        [true, false, true, false, false],
        [true, true, true, true, true],
    ];

    beforeEach(() => {
        sut = new Pathfinder();
    });

    describe("findPaths", () => {
        test("should return the paths between two points", () => {
            const expected = [
                {x: 0, y: 0},
                {x: 1, y: 0},
                {x: 2, y: 0},
                {x: 2, y: 1},
                {x: 2, y: 2},
                {x: 2, y: 3},
                {x: 2, y: 4},
            ];

            expect(sut.findPaths(board, 0, 0, 2, 4)).toEqual(expected);
        });

        test("should return an array of paths between two points", () => {
            const expected = [
                {x: 0, y: 3},
                {x: 0, y: 2},
                {x: 1, y: 2},
                {x: 2, y: 2},
                {x: 2, y: 3},
                {x: 2, y: 4},
            ];

            expect(sut.findPaths(board, 0, 3, 2, 4)).toEqual(expected);
        });

        test("should return the origin coordinates when moving to the same point", () => {
            const target = {x: 0, y: 0};

            const result = sut.findPaths(
                board,
                target.x,
                target.y,
                target.x,
                target.y,
            );

            const expected = [target];
            expect(result).toEqual(expected);
        });

        test("should return an empty array when there is no path between two points", () => {
            const boardWithoutPath = [
                [true, true, false, true, true],
                [true, false, true, false, true],
                [true, true, false, true, true],
            ];
            const noPaths = [
                {startX: 1, startY: 2, endX: 0, endY: 0},
                {startX: 1, startY: 2, endX: 0, endY: 1},
                {startX: 1, startY: 2, endX: 0, endY: 3},
                {startX: 1, startY: 2, endX: 0, endY: 4},
                {startX: 1, startY: 2, endX: 1, endY: 0},
                {startX: 1, startY: 2, endX: 1, endY: 4},
                {startX: 1, startY: 2, endX: 2, endY: 0},
                {startX: 1, startY: 2, endX: 2, endY: 1},
                {startX: 1, startY: 2, endX: 2, endY: 3},
                {startX: 1, startY: 2, endX: 2, endY: 4},
            ];
            let result;

            for (const noPath of noPaths) {
                result = sut.findPaths(
                    boardWithoutPath,
                    noPath.startX,
                    noPath.startY,
                    noPath.endX,
                    noPath.endY,
                );

                expect(result).toEqual([]);
            }
        });

        test("should return true when there is a path available", () => {
            const target = {startX: 0, startY: 0, endX: 1, endY: 0};

            const result = sut.isPathAvailable(
                board,
                target.startX,
                target.startY,
                target.endX,
                target.endY,
            );

            expect(result).toEqual(true);
        });

        test("should return false when there is a path available", () => {
            const boardWithoutPath = [
                [true, true, false, true, true],
                [true, false, true, false, true],
                [true, true, false, true, true],
            ];
            const target = {startX: 1, startY: 2, endX: 0, endY: 0};

            const result = sut.isPathAvailable(
                boardWithoutPath,
                target.startX,
                target.startY,
                target.endX,
                target.endY,
            );

            expect(result).toEqual(false);
        });
    });
});
