"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFalsyFields = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const removeFalsyFields = (obj) => Object.fromEntries(Object.entries(obj).filter(([_, value]) => Boolean(value)));
exports.removeFalsyFields = removeFalsyFields;
