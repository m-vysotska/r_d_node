import 'reflect-metadata';
const INJECT_TOKEN_KEY = Symbol('inject:token');
export function Inject(token) {
    return function (target, propertyKey, parameterIndex) {
        const existingTokens = Reflect.getMetadata(INJECT_TOKEN_KEY, target) || new Map();
        existingTokens.set(parameterIndex, token);
        Reflect.defineMetadata(INJECT_TOKEN_KEY, existingTokens, target);
    };
}
export function getInjectToken(target, parameterIndex) {
    const tokens = Reflect.getMetadata('inject:token', target) || new Map();
    return tokens.get(parameterIndex);
}
