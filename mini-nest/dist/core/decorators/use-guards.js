import { ExpressExecutionContext } from "../utils";
import { container } from "../container";
export const GUARDS_METADATA = Symbol('guards');
export function UseGuards(...guards) {
    return (target, key) => {
        if (key) {
            Reflect.defineMetadata(GUARDS_METADATA, guards, target[key]);
        }
        else {
            Reflect.defineMetadata(GUARDS_METADATA, guards, target);
        }
    };
}
const getGuards = (handler, controllerClass, globalGuards = []) => {
    const controllerGuards = Reflect.getMetadata(GUARDS_METADATA, controllerClass) ?? [];
    const routeGuards = Reflect.getMetadata(GUARDS_METADATA, handler) ?? [];
    globalGuards.push(...controllerGuards, ...routeGuards);
    return globalGuards;
};
export async function runGuards(controllerClass, handler, req, res, globalGuards = []) {
    const guards = getGuards(handler, controllerClass, globalGuards);
    for (const GuardCtor of guards) {
        const guardInstance = container.resolve(GuardCtor);
        const ctx = new ExpressExecutionContext(controllerClass, handler, req, res);
        const can = await Promise.resolve(guardInstance.canActivate(ctx));
        if (!can)
            return GuardCtor.name;
    }
    return true;
}
