

export class Unauthenticated extends Error {
    constructor(message = "") {
        super(message || "You can't perform this action because you're not logged in. The object on which the method was called wasn't created with a session. More information: https://scratchattach.readthedocs.io/en/latest/scratchattach.html#scratchattach.exceptions.Unauthenticated");
        this.name = "Unauthenticated";
    }
}

export class Unauthorized extends Error {
    constructor(message = "") {
        super(message || "You are not authorized to perform this action.");
        this.name = "Unauthorized";
    }
}
export class UserNotFound extends Error {

}
export class ProjectNotFound extends Error {

}
export class StudioNotFound extends Error {

}
export class ConnectionError extends Error {

}
export class XTokenError extends Error {

}
export class LoginFailure extends Error {

}
export class InvalidCloudValue extends Error {

}
export class FetchError extends Error {

}
export class InvalidDecodeInput extends Error {

}
export class BadRequest extends Error {

}
export class Response429 extends Error {

}
export class RequestNotFound extends Error {

}
export class CommentPostFailure extends Error {

}

