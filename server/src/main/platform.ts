import Point from "./point.js";
import * as errorUtil from "./util/error-util.js";

class Platform {
    private readonly height: number;
    private readonly width: number;
    private readonly tiles : Array<Array<boolean>>
    constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
        this.tiles = []
        this.#initPlatform(this.tiles, height, width)
    }

    #initPlatform = (tiles: Array<any>, height: number, width: number) =>{
        for (let x = 0; x < width; x++) {
            tiles[x] = []
            for (let y = 0; y < height; y++) {
                tiles[x][y] = true
            }
        }
    }

    #ensureRangeValid = (position: Point) => {
        if (!this.isTileWithinRange(position)) {
            errorUtil.throwInvalidAction('PLATFORM_TILE', 'Tile is out of range')
        }
    }

    getSize = () => {
        return {
            height : this.height,
            width: this.width
        }
    }

    destroyTile = (position: Point) => {
        this.#ensureRangeValid(position)
        this.tiles[position.getX()][position.getY()] = false
    }

    isTilePresent(position: Point) {
        this.#ensureRangeValid(position)
        return this.tiles[position.getX()][position.getY()]
    }

    isTileWithinRange(position: Point) {
        return position.getX() < this.width && position.getY() < this.height
    }

    getTiles() {
        return [...this.tiles]
    }
}

export default Platform