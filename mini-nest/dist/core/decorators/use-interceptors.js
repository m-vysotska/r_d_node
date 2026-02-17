export const INTERCEPTORS_METADATA = Symbol('interceptors');
export function UseInterceptors(...interceptors) {
    return (target, key) => {
        const where = key ? target[key] : target;
        Reflect.defineMetadata(INTERCEPTORS_METADATA, interceptors, where);
    };
}
/** Збирає глобальні + класові + метод-інтерцептори у правильному порядку */
export function getInterceptors(handler, controller, globalInterceptors = []) {
    const classInterceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, controller) ?? [];
    const methodInterceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, handler) ?? [];
    return [...globalInterceptors, ...classInterceptors, ...methodInterceptors];
}
