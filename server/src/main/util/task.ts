import {randomUUID} from "crypto";

class Task {
    private readonly id: string;
    private readonly fn: any
    private readonly intervalRunner: any
    private readonly interval: number
    private  _shouldCancel: boolean
    private intervalProcessId: any
    private _isRunning: boolean
    private timeRunning: number
    constructor(fn: any, interval: number, id : string = randomUUID(), intervalRunner : any = setInterval) {
        this.id = id
        this._isRunning = false
        this.fn = fn
        this.interval = interval
        this.intervalRunner = intervalRunner
        this._shouldCancel = false
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

    // #manualStart() {
    //     setInterval(() => {
    //         if (this._shouldCancel) {
    //             this._isRunning = false
    //             return;
    //         }
    //         this._isRunning = true
    //         while (!this._shouldCancel) {
    //             let start = Date.now()
    //             let end = start + this.interval
    //             let isTimerDone = Date.now() >= end
    //             while (!isTimerDone && !this._shouldCancel) {
    //                 setTimeout(() => {
    //                 }, 50);
    //                 this.timeRunning = Date.now() - start
    //                 isTimerDone = Date.now() >= end
    //             }
    //             this.fn()
    //         }
    //         this._isRunning = false
    //     }, 50)
    // }
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
        // this._shouldCancel = true
        this._isRunning = false
        clearInterval(this.intervalProcessId)
    }

}

export default Task