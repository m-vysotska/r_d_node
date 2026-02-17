import 'reflect-metadata';
export function Param(data, ...pipes) {
    return function (target, name, idx) {
        const ps = Reflect.getMetadata('design:paramtypes', target, name) ?? [];
        const metatype = ps[idx];
        const params = Reflect.getMetadata('mini:params', target.constructor) ?? [];
        params.push({ index: idx, metatype, type: 'param', data, name });
        Reflect.defineMetadata('mini:params', params, target.constructor);
        if (pipes.length > 0) {
            const paramPipesKey = `mini:param-pipes:${name}:${idx}`;
            Reflect.defineMetadata(paramPipesKey, pipes, target.constructor);
        }
    };
}
export function getParamPipes(controller, handlerName, paramIndex) {
    const paramPipesKey = `mini:param-pipes:${handlerName}:${paramIndex}`;
    return Reflect.getMetadata(paramPipesKey, controller) ?? [];
}
export function UsePipe(...pipes) {
    return function (target, propertyKey, parameterIndex) {
        if (propertyKey) {
            const paramPipesKey = `mini:param-pipes:${String(propertyKey)}:${parameterIndex}`;
            Reflect.defineMetadata(paramPipesKey, pipes, target.constructor);
        }
    };
}
export function Body() {
    return function (target, name, idx) {
        const ps = Reflect.getMetadata('design:paramtypes', target, name) ?? [];
        const metatype = ps[idx];
        const params = Reflect.getMetadata('mini:params', target.constructor) ?? [];
        params.push({ index: idx, type: 'body', metatype, name });
        Reflect.defineMetadata('mini:params', params, target.constructor);
    };
}
export function Query(data) {
    return function (target, name, idx) {
        const ps = Reflect.getMetadata('design:paramtypes', target, name) ?? [];
        const metatype = ps[idx];
        const params = Reflect.getMetadata('mini:params', target.constructor) ?? [];
        params.push({ index: idx, type: 'query', metatype, data, name });
        Reflect.defineMetadata('mini:params', params, target.constructor);
    };
}
