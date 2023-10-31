import "jest";
import {createRoom, activeRooms} from "../main/room";

describe("Room", () => {
    beforeEach(() => {});

    it("should create a room", async () => {
        createRoom("id", "dummy");
        expect(activeRooms.length).toEqual(1);
    });
});
