import { User } from "../types/users.interface";
import { RequestExt } from "../types/req-ext.interface";
import { NextFunction, Request, Response } from "express";
import { ResponseHandler } from "../utils/responseHandler";

// middleare permission
const perMissionMiddleware = (scope: string) => {
    return (req: RequestExt, res: Response, next: NextFunction) => {
      try {
        const { scopes } = req.user as User; // obtenemos los scopes del usuario que hace la peticion.
        if (scopes && scopes.length > 0) {
            if (!scopes.includes(scope)) { // si el usuario no cuenta con el permiso de ver el recurso
                return ResponseHandler.handleDenied(res, {}, "No tienes permiso para realizar esta acción.");
            }
            next(); // pasa la peticion normal.
        } else {
          // El usuario no tiene el permiso, devuelve una respuesta de no autorizado
          return ResponseHandler.handleDenied(res, {}, "No tienes permiso para realizar esta acción.");
        }
      } catch (e) {
        return ResponseHandler.handleDenied(res, {}, "Error validando los permisos.");
      }
    };
};

export default perMissionMiddleware;