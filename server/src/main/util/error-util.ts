export const errors = {
    RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
    TYPE_NOT_SUPPORTED: "TYPE_NOT_SUPPORTED",
    REQUEST_EXPIRED: "REQUEST_EXPIRED",
    INVALID_ACTION: "INVALID_ACTION",
    PLAYER2_MISSING: "PLAYER2_MISSING",
    INTEGRITY_FAILURE: 'INTEGRITY_FAILURE'
};

export const throwIntegrityError = (reason = "") => {
    throw {
        name: errors.INTEGRITY_FAILURE,
        message: `Integrity failed because: ${reason}`,
    };
};
export const throwNotFound = (resource = "") => {
    throw {
        name: errors.RESOURCE_NOT_FOUND,
        message: `Resource ${resource} not found`,
    };
};

export const throwPlayer2Missing = () => {
    throw {
        name: errors.PLAYER2_MISSING,
        message: `Player2 is not in the game`,
    };
};

export const throwInvalidAction = (action = "", reason = "") => {
    throw {
        name: errors.INVALID_ACTION,
        message: `Invalid action '${action}', reason: ${reason}`,
    };
};


export const throwTypeNotSupported = (type = "") => {
    throw {
        name: errors.TYPE_NOT_SUPPORTED,
        message: `Type "${type}" not supported`,
    };
};

export const throwRequestExpired = (request = "") => {
    throw {
        name: errors.REQUEST_EXPIRED,
        message: `Request "${request}" expired.`,
    };
};