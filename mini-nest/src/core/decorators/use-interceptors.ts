import {Type} from "../types";
import {NestInterceptor} from "../interfaces";

export const INTERCEPTORS_METADATA = Symbol('interceptors');

type InterceptorType = Type<NestInterceptor> | NestInterceptor;

export function UseInterceptors(
  ...interceptors: InterceptorType[]
): ClassDecorator & MethodDecorator {
  return (target: any, key?: string | symbol) => {
    const where = key ? target[key] : target;
    Reflect.defineMetadata(INTERCEPTORS_METADATA, interceptors, where);
  };
}

/** Збирає глобальні + класові + метод-інтерцептори у правильному порядку */
export function getInterceptors(
  handler: Function,
  controller: Function,
  globalInterceptors: InterceptorType[] = [],
): InterceptorType[] {
  const classInterceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, controller) ?? [];
  const methodInterceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, handler) ?? [];
  return [...globalInterceptors, ...classInterceptors, ...methodInterceptors];
}
