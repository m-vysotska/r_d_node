export function Controller(prefix = '') {
    return function (target) {
        Reflect.defineMetadata('mini:prefix', prefix, target);
    };
}
export const isController = (target) => {
    return Reflect.hasMetadata('mini:prefix', target);
};
