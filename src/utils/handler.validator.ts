import { NextFunction } from "express";
import { Utils } from "../utils/utils";
import { Request, Response } from "express";
import { ResponseHandler } from "./responseHandler";
import { validationResult } from "express-validator";

// instanciate all class neccesaries
const utils = new Utils();

export const handlerValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validationResult(req).throw();
    return next();
  } catch (error: any) {
    const images: any = req.files as { [key: string]: Express.Multer.File[] };
    if (images) {
      for (const key in images) {
        if (images[key]) {
          images[key].forEach(async (file: any) => {
            const path: string = await utils.getRelativePth(file.path);
            await utils.deleteItemFromStorage(path);
          });
        }
      }
    }
    if (req.file) {
      const path: string = await utils.getRelativePth(req.file.path);
      await utils.deleteItemFromStorage(path);
    }
    return ResponseHandler.handleUnprocessableEntity(
      res,
      error.array(),
      "Error request body"
    );
  }
};
