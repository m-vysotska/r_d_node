import 'reflect-metadata';
export function Route(method, path = '') {
    return function (target, key) {
        const routes = Reflect.getMetadata('mini:routes', target.constructor) ?? [];
        routes.push({ method, path, handlerName: key });
        Reflect.defineMetadata('mini:routes', routes, target.constructor);
    };
}
/* sugar helpers */
export const Get = (p = '') => Route('get', p);
export const Post = (p = '') => Route('post', p);
export const Put = (p = '') => Route('put', p);
export const Patch = (p = '') => Route('patch', p);
export const Delete = (p = '') => Route('delete', p);
