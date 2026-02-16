import 'reflect-metadata';

const INJECT_TOKEN_KEY = Symbol('inject:token');

export function Inject(token?: any) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingTokens: Map<number, any> = Reflect.getMetadata(INJECT_TOKEN_KEY, target) || new Map();
    existingTokens.set(parameterIndex, token);
    Reflect.defineMetadata(INJECT_TOKEN_KEY, existingTokens, target);
  };
}

export function getInjectToken(target: any, parameterIndex: number): any {
  const tokens: Map<number, any> = Reflect.getMetadata('inject:token', target) || new Map();
  return tokens.get(parameterIndex);
}
