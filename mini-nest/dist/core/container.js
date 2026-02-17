import 'reflect-metadata';
import { getInjectToken } from "./decorators";
export class Container {
    #registered = new Map();
    #singletons = new Map();
    resolve(token) {
        if (this.#singletons.has(token))
            return this.#singletons.get(token);
        const cs = this.#registered.get(token);
        if (!cs) {
            throw new Error(`Token ${typeof token === 'function' ? token.name : String(token)} is not registered.`);
        }
        const deps = Reflect.getMetadata("design:paramtypes", cs) || [];
        const injectTokens = new Map();
        if (typeof cs === 'function') {
            for (let i = 0; i < deps.length; i++) {
                const customToken = getInjectToken(cs.prototype, i);
                if (customToken !== undefined) {
                    injectTokens.set(i, customToken);
                }
            }
        }
        const resolved = new cs(...deps.map((d, idx) => {
            const customToken = injectTokens.get(idx);
            const tokenToResolve = customToken !== undefined ? customToken : d;
            if (tokenToResolve === cs) {
                throw new Error(`Circular dependency detected for token ${typeof cs === 'function' ? cs.name : String(cs)}.`);
            }
            return this.resolve(tokenToResolve);
        }));
        this.#singletons.set(token, resolved);
        return resolved;
    }
    register(token, member) {
        if (this.#registered.has(token)) {
            throw new Error(`Token ${typeof token === 'function' ? token.name : String(token)} is already registered.`);
        }
        this.#registered.set(token, member);
    }
    isRegistered(token) {
        return this.#registered.has(token);
    }
}
export const container = new Container();
