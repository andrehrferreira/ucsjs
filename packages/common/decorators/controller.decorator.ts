/**
 * @see https://github.com/nestjs/nest/blob/master/packages/common/decorators/core/controller.decorator.ts
 */

import { PATH_METADATA } from "../constants";
import { isString, isUndefined } from "../utils/shared.utils";

export interface ControllerOptions {
    path?: string | string[];
}

export function Controller(prefix: string | string[]): ClassDecorator;
export function Controller(options: ControllerOptions): ClassDecorator;

export function Controller(
    prefixOrOptions?: string | string[] | ControllerOptions
): ClassDecorator{
    const defaultPath = '/';

    const [path] = isUndefined(prefixOrOptions) 
        ? [defaultPath]
        : isString(prefixOrOptions) || Array.isArray(prefixOrOptions) 
        ? [prefixOrOptions]
        : [
            prefixOrOptions.path || defaultPath
        ];

    return (target: object) => {
        Reflect.defineMetadata(PATH_METADATA, path, target);
    }
}