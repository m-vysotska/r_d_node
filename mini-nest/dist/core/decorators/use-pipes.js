import { isClass } from "../utils";
import { container } from "../container";
export const PIPES_METADATA = Symbol('pipes');
export function UsePipes(...pipes) {
    return (target, key) => {
        const where = key ? target[key] : target;
        Reflect.defineMetadata(PIPES_METADATA, pipes, where);
    };
}
export function getPipes(handler, controller, globalPipes = []) {
    const classPipes = Reflect.getMetadata(PIPES_METADATA, controller) ?? [];
    const methodPipes = Reflect.getMetadata(PIPES_METADATA, handler) ?? [];
    return [...globalPipes, ...classPipes, ...methodPipes];
}
export async function runPipes(controllerCls, handler, value, meta, globalPipes = [], paramPipes = []) {
    const pipes = getPipes(handler, controllerCls, globalPipes);
    const allPipes = [...pipes, ...paramPipes];
    let transformed = value;
    for (const PipeCtor of allPipes) {
        const pipeInstance = isClass(PipeCtor) ? container.resolve(PipeCtor) : PipeCtor;
        transformed = await Promise.resolve(pipeInstance.transform(transformed, meta));
    }
    return transformed;
}
