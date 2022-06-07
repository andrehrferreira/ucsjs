/**
 * @see https://github.com/nestjs/nest/blob/master/packages/common/utils/shared.utils.ts
 */

/* eslint-disable @typescript-eslint/no-use-before-define */
export const isUndefined = (object: any): object is undefined => typeof object === "undefined";
export const isObject = (fn: any): fn is object => !isNil(fn) && typeof fn === "object";
export const isNil = (val: any): val is null | undefined => isUndefined(val) || val === null;
export const isFunction = (val: any): boolean => typeof val === 'function';
export const isString = (val: any): val is string => typeof val === 'string';
export const isNumber = (val: any): val is number => typeof val === 'number';
export const isConstructor = (val: any): boolean => val === 'constructor';
export const isEmpty = (array: any): boolean => !(array && array.length > 0);
export const isSymbol = (val: any): val is symbol => typeof val === 'symbol';