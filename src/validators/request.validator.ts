import { check } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { handlerValidator } from "../utils/handler.validator";

const PaginationValidator = [
  check("page")
    .exists()
    .withMessage("Debes especificar una pagina.")
    .notEmpty()
    .withMessage("La pagina no puede estar vacia.")
    .isNumeric()
    .withMessage("La pagina debe ser un numero."),
  check("perPage")
    .exists()
    .withMessage("Debes especificar la cantidad de registros por pagina.")
    .notEmpty()
    .withMessage("La cantidad de registros por pagina no puede estar vacia.")
    .isNumeric()
    .withMessage("La cantidad de registros por pagina debe ser un numero.")
    .custom((value: string) => {
      if (parseInt(value) > 100) {
        throw new Error("La cantidad de registros por pagina debe ser menor a 100");
      }
      return true;
    }),
  check("search")
    .optional(),
  check("type")
    .optional(),
  check("is_active")
    .optional(),
  check("sortBy")
    .optional(),
  check("order")
    .optional(),
  check("fields")
    .optional(),
  (req: Request, res: Response, next: NextFunction) =>
    handlerValidator(req, res, next),
];

export { PaginationValidator };
