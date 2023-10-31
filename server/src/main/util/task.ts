import {randomUUID} from "crypto";

class Task {
    private readonly id: string;
    private readonly fn: any
    private readonly intervalRunner: any
    private readonly interval: number
    private intervalProcessId: any
    private _isRunning: boolean
    private timeRunning: number
    constructor(fn: any, interval: number, id : string = randomUUID(), intervalRunner : any = setInterval) {
        this.id = id
        this._isRunning = false
        this.fn = fn
        this.interval = interval
        this.intervalRunner = intervalRunner
    }

    getId() {
        return this.id
    }
    isRunning() {
        return this._isRunning
    }

    getTimeRunning() {
        return this.timeRunning
    }
    start() {
        this._isRunning = true
        this.timeRunning = 0
        const wrapper = () => {
            this.fn()
            this.timeRunning = 0
        }
        setInterval(() => {
            this.timeRunning += 200
        }, 200)
        this.intervalProcessId = this.intervalRunner(wrapper, this.interval)
    }

    stop() {
        this._isRunning = false
        clearInterval(this.intervalProcessId)
    }

}

export default Task