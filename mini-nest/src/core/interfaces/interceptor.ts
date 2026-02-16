import type {ExecutionContext} from "../utils";

export interface NestInterceptor<T = any, R = any> {
  intercept(ctx: ExecutionContext, next: () => Promise<R>): Promise<R> | R;
}
