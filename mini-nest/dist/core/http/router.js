import express from 'express';
import { container } from '../container';
import { get } from "../utils";
import { GuardsMiddleware } from "./guards.middleware";
import { HandlerMiddleware } from "./handler.middleware";
import { FiltersMiddleware } from "./filters.middleware";
import { InterceptorsMiddleware } from "./interceptors.middleware";
import { asyncHandler } from "./async.handler";
export function Factory(modules) {
    const app = express();
    app.use(express.json());
    const router = express.Router();
    const globalGuards = [];
    const globalPipes = [];
    const globalInterceptors = [];
    const globalFilters = [];
    const listen = (port, callback) => {
        const processModule = (mod) => {
            const meta = get('mini:module', mod);
            if (!meta)
                return;
            for (const importedMod of meta.imports ?? []) {
                processModule(importedMod);
            }
            for (const provider of meta.providers ?? []) {
                if (!container.isRegistered(provider)) {
                    container.register(provider, provider);
                }
            }
            const exportedProviders = meta.exports ?? meta.providers ?? [];
            for (const exportedProvider of exportedProviders) {
                if (!container.isRegistered(exportedProvider)) {
                    container.register(exportedProvider, exportedProvider);
                }
            }
        };
        for (const mod of modules) {
            processModule(mod);
        }
        for (const mod of modules) {
            const meta = get('mini:module', mod);
            if (!meta)
                continue;
            for (const Ctl of meta.controllers ?? []) {
                container.register(Ctl, Ctl);
                const prefix = get('mini:prefix', Ctl) ?? '';
                const routes = get('mini:routes', Ctl) ?? [];
                const instance = container.resolve(Ctl);
                routes.forEach((r) => {
                    const handler = instance[r.handlerName];
                    const path = prefix + r.path;
                    const handlerMiddleware = HandlerMiddleware(instance, handler, globalPipes);
                    const interceptorsMiddleware = InterceptorsMiddleware(Ctl, handler, globalInterceptors, handlerMiddleware);
                    router[r.method](path, asyncHandler(GuardsMiddleware(Ctl, handler, globalGuards)), asyncHandler(interceptorsMiddleware), asyncHandler(FiltersMiddleware(Ctl, handler, globalFilters)));
                });
            }
        }
        app.listen(port, callback);
    };
    app.use(router);
    return {
        get: container.resolve,
        listen,
        use: (path, handler) => {
            app.use(path, handler);
        },
        useGlobalGuards: (guards) => {
            globalGuards.push(...guards);
        },
        useGlobalPipes: (pipes) => {
            globalPipes.push(...pipes);
        },
        useGlobalFilters: (filters) => {
            globalFilters.push(...filters);
        },
        useGlobalInterceptors: (interceptors) => {
            globalInterceptors.push(...interceptors);
        },
    };
}
