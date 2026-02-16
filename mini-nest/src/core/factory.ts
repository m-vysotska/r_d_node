import {Type} from "./types";
import {Factory} from "./http";

export class NestFactory {
  static create(module: Type): ReturnType<typeof Factory> {
    return Factory([module]);
  }
}
