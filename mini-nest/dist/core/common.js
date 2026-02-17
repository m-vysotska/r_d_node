export class HttpException extends Error {
    status;
    message;
    constructor(status, message) {
        super(message);
        this.status = status;
        this.message = message;
        this.name = 'HttpException';
    }
}
export class BadRequestException extends HttpException {
    constructor(message = 'Bad Request') {
        super(400, message);
        this.name = 'BadRequestException';
    }
}
export * from './factory';
