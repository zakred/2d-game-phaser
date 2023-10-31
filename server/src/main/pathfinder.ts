export default class Pathfinder {
    constructor() {}

    /**
     * Write a javascript function to find if there is a path to move from x and y point to another x and y point in multi dimensional array filled with booleans, representing a board that is 3 width and 5 height, the width array will be equivalent to the coordinates x and the height equivalent to y position, the characters can not walk in diagonal, it should return an empty array if no paths available or an array with the paths it needs to traverse in a JSON object with x and y, and create unit tests written with jest framework
     *
     * @param board this will be the platform
     * @param startX origin X
     * @param startY origin Y
     * @param endX target X
     * @param endY target Y
     */
    findPaths(
        board: any,
        startX: number,
        startY: number,
        endX: number,
        endY: number,
    ) {
        // Create a queue for BFS
        let queue = [];
        queue.push([{x: startX, y: startY}]);

        // Create a visited array to keep track of visited cells
        let visited = new Array(3);
        for (let i = 0; i < visited.length; i++) {
            visited[i] = new Array(5).fill(false);
        }

        // Mark the starting cell as visited
        visited[startX][startY] = true;

        // Define the directions in which we can move
        let directions = [
            [-1, 0],
            [0, -1],
            [1, 0],
            [0, 1],
        ];

        // BFS algorithm
        while (queue.length > 0) {
            // Dequeue a path from queue
            let currentPath = queue.shift();
            let currentCell = currentPath[currentPath.length - 1];

            // If we have reached the end cell, return the path
            if (currentCell.x === endX && currentCell.y === endY) {
                return currentPath;
            }

            // Explore all adjacent cells
            for (let i = 0; i < directions.length; i++) {
                let nextX = currentCell.x + directions[i][0];
                let nextY = currentCell.y + directions[i][1];

                // Check if the adjacent cell is valid and not visited
                if (
                    nextX >= 0 &&
                    nextX < 3 &&
                    nextY >= 0 &&
                    nextY < 5 &&
                    board[nextX][nextY] &&
                    !visited[nextX][nextY]
                ) {
                    // Mark the adjacent cell as visited and enqueue it
                    visited[nextX][nextY] = true;
                    let newPath = [...currentPath];
                    newPath.push({x: nextX, y: nextY});
                    queue.push(newPath);
                }
            }
        }

        // If we have not found a path, return an empty array
        return [];
    }

    isPathAvailable(
        board: any,
        startX: number,
        startY: number,
        endX: number,
        endY: number,
    ) {
        const paths = this.findPaths(board, startX, startY, endX, endY);
        return paths.length >= 2;
    }
}
