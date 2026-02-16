import express from 'express';
import {container} from '../container';
import {Type} from "../types";
import {get} from "../utils";
import {GuardsMiddleware} from "./guards.middleware";
import {HandlerMiddleware} from "./handler.middleware";
import {FiltersMiddleware} from "./filters.middleware";
import {InterceptorsMiddleware} from "./interceptors.middleware";
import {asyncHandler} from "./async.handler";
import {HttpException} from "../common";

export function Factory(modules: any[]) {
  const app = express();

  app.use(express.json());

  const router = express.Router();
  const globalGuards: Array<Type> = [];
  const globalPipes: Array<Type>  = [];
  const globalInterceptors: Array<Type>  = [];
  const globalFilters: Array<Type>  = [];

  const processModule = (mod: any) => {
    const meta = get('mini:module', mod);
    if (!meta) return;

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
    if (!meta) continue;

    for (const Ctl of meta.controllers ?? []) {
      container.register(Ctl, Ctl)
      const prefix = get('mini:prefix', Ctl) ?? '';
      const routes = get('mini:routes', Ctl) ?? [];

      const instance = container.resolve(Ctl) as InstanceType<typeof Ctl>;

      routes.forEach((r: any) => {
        const handler = instance[r.handlerName] as (...args: any[]) => Promise<any>;

        const path = prefix + r.path;

        const handlerMiddleware = HandlerMiddleware(instance, handler, globalPipes);
        const interceptorsMiddleware = InterceptorsMiddleware(Ctl, handler, globalInterceptors, handlerMiddleware);
        const filtersMiddleware = FiltersMiddleware(Ctl, handler, globalFilters);
        
        (router as any)[r.method](
          path,
          asyncHandler(GuardsMiddleware(Ctl, handler, globalGuards)),
          asyncHandler(interceptorsMiddleware),
          filtersMiddleware,
        );
      });
    }
  }

  router.use((err: any, req: any, res: any, _next: any) => {
    if (err instanceof HttpException) {
      return res.status(err.status).json({ error: err.message });
    }
    
    err.stack = undefined;
    const status = (err as Error & { status: number }).status || 500;
    res.status(status).json({error: err.message || 'Server error'});
  });

  app.use(router);

  const listen = (port: number, callback?: () => void) => {
    app.listen(port, callback);
  }

  return {
    get: container.resolve,
    listen,
    use: (path: string, handler: express.RequestHandler) => {
      app.use(path, handler);
    },
    useGlobalGuards: (guards: any[]) => {
      globalGuards.push(...guards);
    },
    useGlobalPipes: (pipes: any[]) => {
      globalPipes.push(...pipes);
    },
    useGlobalFilters: (filters: any[]) => {
      globalFilters.push(...filters);
    },
    useGlobalInterceptors: (interceptors: any[]) => {
      globalInterceptors.push(...interceptors);
    },
  }
}
