import { IAuthData } from "../../interface/auth.interface";

declare global {
  namespace Express {
    interface Request {
      user: IAuthData;
    }
  }
}
