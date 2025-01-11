import { Utils } from "../utils/utils";
import { NextFunction, Response } from "express";
import { ResponseHandler } from "../utils/responseHandler";
import { RequestExt } from "../types/req-ext.interface";

// instances
const utils = new Utils();

const sessionCheck = async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const jwtByUser = req.headers.authorization || "";
    const jwt = jwtByUser.split(" ").pop();
    const isUser = await utils.verifyToken(`${jwt}`) as { id: string };
    if (!isUser) {
      return ResponseHandler.handleUnauthorized(res, {}, "Necesitas estar logueado para acceder a este recurso.");
    } else {
      req.user = isUser;
      next();
    }
  } catch (e) {
    return ResponseHandler.handleUnauthorized(res, {}, "Aun no has iniciado sesión.");
  }
};

export default sessionCheck;