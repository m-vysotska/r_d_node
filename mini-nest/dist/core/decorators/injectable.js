import { container } from "../container";
export function Injectable() {
    return function (target) {
        container.register(target, target);
    };
}
