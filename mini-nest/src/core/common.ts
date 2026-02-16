export class HttpException extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string,
  ) {
    super(message);
    this.name = 'HttpException';
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = 'Bad Request') {
    super(400, message);
    this.name = 'BadRequestException';
  }
}

export * from './factory';
