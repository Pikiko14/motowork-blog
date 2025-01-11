import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { ResponseHandler } from "../utils/responseHandler";
import { BlogsService } from "../services/blogs.service";
import { BlogsInterface } from "../types/blogs.interface";
import { ResponseRequestInterface } from "../types/response.interface";
import { PaginationInterface, RequestExt } from "../types/req-ext.interface";

export class BlogsController {
  public service;

  constructor() {
    this.service = new BlogsService();
  }

  /**
   * Create blog
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
  createBlogs = async (
    req: Request,
    res: Response
  ): Promise<void | ResponseRequestInterface> => {
    try {
      // get body
      const body = matchedData(req) as BlogsInterface;

      // store blogs
      return await this.service.createBlogs(
        res,
        body,
      );
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  };

  /**
   * Upload files
   * @param req Express request
   * @param res Express response
   * @returns Promise<void>
   */
  uploadFiles = async (req: RequestExt, res: Response): Promise<void> => {
    try {
      const imagesMobile = req.files["imagesMobile"]
        ? req.files["imagesMobile"]
        : null;
      const imagesDesktop = req.files["imagesDesktop"]
        ? req.files["imagesDesktop"]
        : null;

      console.log(imagesMobile?.length);
      console.log(imagesDesktop?.length);

      // store products
      return await this.service.uploadFiles(
        res,
        imagesMobile,
        imagesDesktop,
        req.body.id
      );

      res.status(200).json({ success: true });
    } catch (error: any) {
      ResponseHandler.handleInternalError(res, error, error.message ?? error);
    }
  };
}