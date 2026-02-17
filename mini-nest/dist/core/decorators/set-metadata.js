export const SetMetadata = (metadataKey, metadataValue) => {
    const df = (target, key, descriptor) => {
        if (descriptor) {
            Reflect.defineMetadata(metadataKey, metadataValue, descriptor.value);
            return descriptor;
        }
        Reflect.defineMetadata(metadataKey, metadataValue, target);
        return target;
    };
    df.KEY = metadataKey;
    return df;
};
