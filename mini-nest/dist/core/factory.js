import { Factory } from "./http";
export class NestFactory {
    static create(module) {
        return Factory([module]);
    }
}
