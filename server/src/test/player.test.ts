import 'jest';
import Player from '../main/player';

describe('Player', () => {
    let sut: Player

    beforeEach(() => {
        sut = new Player('dummy');
    });

    it('should have an id', async () => {
        const result = sut.getId()

        expect(result.length).toBeGreaterThan(10)
    });

    it('should be able to set an id', async () => {
        sut = new Player('dummy', 'id');

        const result = sut.getId()

        expect(result).toBe('id')
    });

    it('should have a name', async () => {
        const result = sut.getName()

        expect(result).toEqual('dummy')
    });

    it('should be alive when created', async () => {
        const result = sut.isAlive()

        expect(result).toBeTruthy()
    });

    it('should not be alive after getting shot', async () => {
        sut.shoot()
        const result = sut.isAlive()

        expect(result).toBeFalsy()
    });
});