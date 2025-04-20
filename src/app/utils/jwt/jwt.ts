/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import { IAuthData } from "../../interface/auth.interface";

const verifyJwt = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret) as IAuthData;
  } catch (error: any) {
    throw new Error(error);
  }
};

const generateToken = (payload: object, secret: string, expiresIn: any) => {
  try {
    const token = jwt.sign(payload, secret, {
      expiresIn,
    });
    return token;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const jsonWebToken = {
  verifyJwt,
  generateToken,
};
