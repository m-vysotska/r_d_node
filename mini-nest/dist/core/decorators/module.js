export function Module(metadata) {
    return function (target) {
        Reflect.defineMetadata('mini:module', metadata, target);
    };
}
