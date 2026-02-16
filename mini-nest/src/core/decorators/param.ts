import 'reflect-metadata';
import {ArgumentMetadata} from "../types";
import {PIPES_METADATA} from "./use-pipes";

export function Param(data?: string, ...pipes: any[]) {
  return function (target: any, name: string, idx: number) {
    const ps = Reflect.getMetadata('design:paramtypes', target, name) ?? [];
    const metatype = ps[idx];
    const params: Array<ArgumentMetadata> =
      Reflect.getMetadata('mini:params', target.constructor) ?? [];
    params.push({ index: idx, metatype, type: 'param', data, name });
    Reflect.defineMetadata('mini:params', params, target.constructor);
    
    if (pipes.length > 0) {
      const paramPipesKey = `mini:param-pipes:${name}:${idx}`;
      Reflect.defineMetadata(paramPipesKey, pipes, target.constructor);
    }
  };
}

export function getParamPipes(controller: Function, handlerName: string, paramIndex: number): any[] {
  const paramPipesKey = `mini:param-pipes:${handlerName}:${paramIndex}`;
  return Reflect.getMetadata(paramPipesKey, controller) ?? [];
}

export function UsePipe(...pipes: any[]) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    if (propertyKey) {
      const paramPipesKey = `mini:param-pipes:${String(propertyKey)}:${parameterIndex}`;
      Reflect.defineMetadata(paramPipesKey, pipes, target.constructor);
    }
  };
}

export function Body() {
  return function (target: any, name: string, idx: number) {
    const ps = Reflect.getMetadata('design:paramtypes', target, name) ?? [];
    const metatype = ps[idx];
    const params: Array<ArgumentMetadata> =
      Reflect.getMetadata('mini:params', target.constructor) ?? [];
    params.push({ index: idx, type: 'body', metatype, name });
    Reflect.defineMetadata('mini:params', params, target.constructor);
  };
}

export function Query(data: string) {
  return function (target: any, name: string, idx: number) {
    const ps = Reflect.getMetadata('design:paramtypes', target, name) ?? [];
    const metatype = ps[idx];
    const params: Array<ArgumentMetadata> =
      Reflect.getMetadata('mini:params', target.constructor) ?? [];
    params.push({ index: idx, type: 'query', metatype, data, name });
    Reflect.defineMetadata('mini:params', params, target.constructor);
  };
}
