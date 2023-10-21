import 'jest';
import Platform from '../main/platform';
import Point from "../main/point";
import * as errorUtil from"../main/util/error-util"

describe('Platform', () => {
    let sut: Platform

    beforeEach(() => {
        sut = new Platform(10, 10);
    });

    it('should have width and height', async () => {
        expect(sut.getSize().height).toEqual(10)
        expect(sut.getSize().width).toEqual(10)
    });

    it('should have all present tiles', async () => {
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                let position = new Point(x, y)

                let result = sut.isTilePresent(position)

                expect(result).toBeTruthy()
            }
        }
    });

    it('should have out of range point X', async () => {
        let position = new Point(9, 11)

        let result = sut.isTileWithinRange(position)

        expect(result).toBeFalsy()
    });

    it('should have out of range point Y', async () => {
        let position = new Point(11, 9)

        let result = sut.isTileWithinRange(position)

        expect(result).toBeFalsy()
    });

    it('should throw when tile is out of range', async () => {
        let position = new Point(9, 11)

        expect(() => sut.destroyTile(position)).toThrow('Invalid action')
    });

    it('should destroy tile', async () => {
        let position = new Point(0, 2)
        sut.destroyTile(position)

        let result = sut.isTilePresent(position)

        expect(result).toBeFalsy()
    });

});