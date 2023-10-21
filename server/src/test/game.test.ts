import 'jest';
import Game from '../main/game';
import {GameStatus} from '../main/game_status'
import {ActionType} from "../main/action_type";
import Point from "../main/point";
const errors = require("../main/util/error-util")

describe('Game', () => {
    let sut: Game
    let player1: any
    let player2: any
    let taskRunner: any
    let taskRunnerFn: any
    let taskRunnerStartMock: any
    let taskRunnerGetTimeRunningMock: any

    beforeEach(() => {
        taskRunnerStartMock = jest.fn()
        taskRunnerGetTimeRunningMock = jest.fn()
        taskRunner = class {
            constructor(fn: any) {
                taskRunnerFn = fn
            }
            start = taskRunnerStartMock
            getTimeRunning = taskRunnerGetTimeRunningMock
        }
        player1 = {}
        player2 = {}
        sut = new Game('dummy', player1, 'dummy', 10000, taskRunner);
    });

    it('should have an id', async () => {
        sut = new Game('dummy', undefined)
        const result = sut.getId();

        expect(result).toHaveLength(36)
    });

    it('should have an initial turn remaining time of 0', async () => {
        const result = sut.getTurnTimeRunning();

        expect(result).toBe(0)
    });

    it('should be able to set an id', async () => {
        sut = new Game('dummy', player1, 'id');

        const result = sut.getId()

        expect(result).toBe('id')
    });

    it('should have a name', async () => {
        const result = sut.getName()

        expect(result).toEqual('dummy')
    });

    it('should have a name', async () => {
        const result = sut.getName()

        expect(result).toEqual('dummy')
    });

    it('should have a turn duration', async () => {
        const result = sut.getTurnDuration()

        expect(result).toBeTruthy()
    });

    it('should be able to set a game duration', async () => {
        sut = new Game('dummy', player1, 'dummy', 1);

        const result = sut.getTurnDuration()

        expect(result).toEqual(1)
    });

    it('should return players ids', async () => {
        player1.getId = () => 'id'

        const result = sut.getPlayerIds()

        expect(result.player1).toBeTruthy()
        expect(result.player2).toBeFalsy()
    });

    it('should be able to add player2', async () => {
        player1.getId = () => 'dummy'
        player2.getId = () => 'id'
        sut.setPlayer2(player2)

        const result = sut.getPlayerIds()

        expect(result.player2).toBeTruthy()
    });

    it('should throw when starting the game without player2', async () => {
        expect(() => sut.start()).toThrow(errors.PLAYER2_MISSING)
    });

    it('should have waiting for player2 status after creation', async () => {
        expect(sut.getState().status).toBe(GameStatus.WAITING_FOR_PLAYER2)
    });

    it('should have not started status after player2 joins', async () => {
        sut.setPlayer2(player2)

        expect(sut.getState().status).toBe(GameStatus.NOT_STARTED)
    });

    it('should have running status when starting with player2', async () => {
        player1.getId = () => '1'
        player2.getId = () => '2'
        sut.setPlayer2(player2)

        sut.start()

        expect(sut.getState().status).toBe(GameStatus.RUNNING)
    });

    it('should change turn after calling advance turn', async () => {
        player1.getId = () => '1'
        player2.getId = () => '2'
        player1.isAlive = () => true
        player2.isAlive = () => true
        sut.setPlayer2(player2)
        sut.start()
        sut.advanceTurn()

        const result = sut.getState()

        expect(result.turn).toEqual(2)
    });

    it('should advance the turn automatically using the task timer', async () => {
        player1.getId = () => '1'
        player2.getId = () => '2'
        player1.isAlive = () => true
        player2.isAlive = () => true
        sut.setPlayer2(player2)
        sut.start()
        taskRunnerFn()

        const result = sut.getState()

        expect(result.turn).toEqual(2)
        expect(taskRunnerStartMock).toBeCalledTimes(1)
    });

    it('should return turn remaining time once the game has started', async () => {
        player1.getId = () => '1'
        player2.getId = () => '2'
        sut.setPlayer2(player2)
        sut.start()

        sut.getTurnTimeRunning()

        expect(taskRunnerStartMock).toBeCalledTimes(1)
    });

    it('should move player after turn', async () => {
        player1.getId = () => '1'
        player2.getId = () => '2'
        player1.isAlive = () => true
        player2.isAlive = () => true
        sut.setPlayer2(player2)
        sut.start()
        const payload = {x: 1, y: 1}
        sut.addAction('1', ActionType.MOVE, payload)

        const prevPosition = sut.getState().playersPosition['1'].get()
        sut.advanceTurn()
        const nextPosition = sut.getState().playersPosition['1'].get()

        expect(prevPosition).toEqual({x: 0, y: 4})
        expect(nextPosition).toEqual({x: 1, y: 1})
    });

    it('should move player to latest sent action after turn', async () => {
        player1.getId = () => '1'
        player2.getId = () => '2'
        player1.isAlive = () => true
        player2.isAlive = () => true
        sut.setPlayer2(player2)
        sut.start()
        const payload = {x: 1, y: 1}
        sut.addAction('1', ActionType.MOVE, payload)
        const latestPosition = {x: 2, y: 2}
        sut.addAction('1', ActionType.MOVE, latestPosition)

        sut.advanceTurn()
        const nextPosition = sut.getState().playersPosition['1'].get()

        expect(nextPosition).toEqual(latestPosition)
    });

    it('should get enemy platform from the player id', async () => {
        player1.getId = () => '1'
        player2.getId = () => '2'
        sut.setPlayer2(player2)
        sut.start()

        const result = sut.getEnemyPlatform('1')

        expect(sut.getState().platform2).toBe(result)
    });

    it('should destroy a tile in the platform when opponent shoots it', async () => {
        player1.getId = () => '1'
        player2.getId = () => '2'
        player1.isAlive = () => true
        player2.isAlive = () => true
        sut.setPlayer2(player2)
        sut.start()
        const payload = {x: 1, y: 1}
        sut.addAction('1', ActionType.SHOOT, payload)

        sut.advanceTurn()
        const result = sut.getState().platform2.isTilePresent(new Point(1, 1))

        expect(result).toBeFalsy()
    });

    it('should kill the player when opponent hit', async () => {
        player1.getId = () => '1'
        player1.isAlive = () => false
        player1.shoot = jest.fn()
        player2.getId = () => '2'
        sut.setPlayer2(player2)
        sut.start()
        sut.addAction('1', ActionType.MOVE, {x: 2, y: 2})
        sut.addAction('2', ActionType.SHOOT, {x: 2, y: 2})

        sut.advanceTurn()

        expect(player1.shoot).toBeCalledTimes(1)
    });

    it('should be game over once a player dies', async () => {
        player1.getId = () => '1'
        player2.getId = () => '2'
        player1.isAlive = () => false
        player2.isAlive = () => true
        player1.shoot = () => {}
        sut.setPlayer2(player2)
        sut.start()
        sut.addAction('1', ActionType.MOVE, {x: 2, y: 2})
        sut.addAction('2', ActionType.SHOOT, {x: 2, y: 2})

        sut.advanceTurn()
        const result = sut.getState().status

        expect(result).toBe(GameStatus.OVER)
    });

    it('should return the history of turn actions in publishable object', async () => {
        player1.getId = () => '1'
        player2.getId = () => '2'
        player1.isAlive = () => false
        player2.isAlive = () => true
        player1.shoot = () => {}
        player2.shoot = () => {}
        sut.setPlayer2(player2)
        sut.start()

        sut.addAction('1', ActionType.MOVE, {x: 2, y: 2})
        sut.addAction('2', ActionType.SHOOT, {x: 2, y: 2})
        sut.advanceTurn()
        sut.addAction('1', ActionType.SHOOT, {x: 2, y: 2})
        sut.addAction('2', ActionType.MOVE, {x: 2, y: 2})
        sut.advanceTurn()
        sut.advanceTurn()
        const result = sut.getPublishableActionsHistory()

        expect(result).toHaveLength(4)
        expect(result[0].player).toBe(1)
        expect(result[1].player).toBe(2)
        expect(result[2].player).toBe(1)
        expect(result[3].player).toBe(2)
        expect(result[0].type).toBe(ActionType.MOVE)
        expect(result[1].type).toBe(ActionType.SHOOT)
        expect(result[2].type).toBe(ActionType.SHOOT)
        expect(result[3].type).toBe(ActionType.MOVE)
        expect(result[0].turn).toBe(1)
        expect(result[1].turn).toBe(1)
        expect(result[2].turn).toBe(2)
        expect(result[3].turn).toBe(2)
    });
});