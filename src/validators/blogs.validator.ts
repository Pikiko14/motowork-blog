import { check } from "express-validator";
import BlogsModel from "../models/blogs.model";
import { Request, Response, NextFunction } from "express";
import { handlerValidator } from "../utils/handler.validator";

const BlogsCreationValidator = [
  check("title")
    .exists()
    .withMessage("Debes especificar el titulo de la entrada.")
    .isLength({ min: 1, max: 120 })
    .withMessage("El titulo debe tener entre 1 y 120 caracteres."),
  check('description')
    .exists()
    .withMessage("Debes especificar la descripción de la entrada.")
    .isLength({ min: 1, max: 10000 })
    .withMessage("La descripción debe tener entre 1 y 1000 caracteres."),
  check('category')
    .exists()
    .withMessage("Debes especificar la categoría de la entrada.")
    .isString()
    .withMessage("La categoría debe ser un string.")
    .custom(async (value: string) => {
      const categories = [
        'Noticias',
        'Consejos y Guías',
        'Técnicos',
        'Estilo de vida',
        'Comunidad'
      ];
      if (!categories.includes(value)) {
        throw new Error(`La categoría debe ser una de las siguientes opciones: ${categories.join(', ')}.`);
      };
      return true;
    }),
  check('subcategory')
    .optional()
    .isString()
    .withMessage('La subcategoría debe ser un string')
    .custom(async (value: string) => {
      const subcategory = [
        'Marcas',
        'Mantenimiento',
        'Conducción',
        'Viajes',
        'Motor',
        'Suspensión',
        'Frenos',
        'Moda',
        'Música',
        'Pelicular',
        'Eventos',
        'Regiones',
        'Viajes',
        'Rutas',
        'Carreras',
        'Reseñas'
      ];
      if (!subcategory.includes(value)) {
        throw new Error(`La subcategoría debe ser una de las siguientes opciones: ${subcategory.join(', ')}.`);
      };
      return true;
    }),
  check('more_details')
    .optional()
    .isString()
    .withMessage('Los detalles extras deben ser un string')
    .isLength({ min: 0, max: 10000 })
    .withMessage("Los detalles extras debe tener entre 0 y 1000 caracteres."),
  (req: Request, res: Response, next: NextFunction) =>
    handlerValidator(req, res, next),
];

const BlogsIdValidator = [
  check("id")
    .exists()
    .withMessage("El id de el blog es requerido.")
    .notEmpty()
    .withMessage("El id el blog no puede estar vacio.")
    .isString()
    .withMessage("El id el blog debe ser una cadena de texto.")
    .isMongoId()
    .withMessage("El id el blog debe ser un id de mongo.")
    .custom(async (id: string) => {
      const brand = await BlogsModel.findById(id);
      if (!brand) {
        throw new Error("La entrada no existe");
      }
      return true;
    }),
  (req: Request, res: Response, next: NextFunction) =>
    handlerValidator(req, res, next),
];

export { BlogsCreationValidator, BlogsIdValidator };
