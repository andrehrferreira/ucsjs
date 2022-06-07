
/**
 * @see https://github.com/nestjs/nest/blob/master/packages/common/decorators/http/request-mapping.decorator.ts
 */

import { METHOD_METADATA, PATH_METADATA, TEMPLATE_MEDATA } from '../constants';
import { RequestMethod } from "../enums/request-method.enum";

export interface RequestMappingMetadata {
    path?: string | string[];
    template?: string;
    method?: RequestMethod;
}

const defaultMetadata = {
    [PATH_METADATA]: '/',
    [METHOD_METADATA]: RequestMethod.GET,
    [TEMPLATE_MEDATA]: ""
};

export const RequestMapping = (
    metadata: RequestMappingMetadata = defaultMetadata,
): MethodDecorator => {
    const pathMetadata = metadata[PATH_METADATA];
    const path = pathMetadata && pathMetadata.length ? pathMetadata : '/';
    const requestMethod = metadata[METHOD_METADATA] || RequestMethod.GET;
    const templateMatadata = metadata[TEMPLATE_MEDATA];

    return (
        target: object,
        key: string | symbol,
        descriptor: TypedPropertyDescriptor<any>,
    )=> {
        Reflect.defineMetadata(PATH_METADATA, path, descriptor.value);
        Reflect.defineMetadata(METHOD_METADATA, requestMethod, descriptor.value);
        Reflect.defineMetadata(TEMPLATE_MEDATA, templateMatadata, descriptor.value);
        return descriptor;
    };
};

const createMappingDecorator =
  (method: RequestMethod) =>
  (path?: string | string[], template?: string): MethodDecorator => {
    return RequestMapping({
      [PATH_METADATA]: path,
      [METHOD_METADATA]: method,
      [TEMPLATE_MEDATA]: template
    });
  };

export const Post = createMappingDecorator(RequestMethod.POST);
export const Get = createMappingDecorator(RequestMethod.GET);
export const Delete = createMappingDecorator(RequestMethod.DELETE);
export const Put = createMappingDecorator(RequestMethod.PUT);
export const Patch = createMappingDecorator(RequestMethod.PATCH);
export const Options = createMappingDecorator(RequestMethod.OPTIONS);
export const Head = createMappingDecorator(RequestMethod.HEAD);
export const All = createMappingDecorator(RequestMethod.ALL);