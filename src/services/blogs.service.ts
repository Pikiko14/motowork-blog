import { Response } from "express";
import { Utils } from "../utils/utils";
import { TaskQueue } from '../queues/cloudinary.queue';
import { CloudinaryService } from "./cloudinary.service";
import { BlogsInterface } from "../types/blogs.interface";
import { ResponseHandler } from "../utils/responseHandler";
import { PaginationInterface } from "../types/req-ext.interface";
import BlogsRepository from "../repositories/blogs.repository";
import { ResponseRequestInterface } from "../types/response.interface";

export class BlogsService extends BlogsRepository {
  private utils: Utils;
  public path: String;
  public queue: any;
  public folder: string = "blogs";
  public cloudinaryService: CloudinaryService;

  constructor(
  ) {
    super();
    this.path = "/blogs/";
    this.utils = new Utils();
    this.queue = new TaskQueue('cloudinary_blogs');
    this.queue.setupListeners();
    this.cloudinaryService = new CloudinaryService();
  }

  /**
   * Create blogs
   * @param { Response } res Express response
   * @param { BlogsInterface } body BlogsInterface
   * @param { Express.Multer.File } file Express.Multer.File
   */
  public async createBlogs(
    res: Response,
    body: BlogsInterface,
  ): Promise<void | ResponseHandler> {
    try {
      // validate file
      const blog = (await this.create(body)) as BlogsInterface;

      // return response
      return ResponseHandler.successResponse(
        res,
        blog,
        "Entrada creada correctamente."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Upload file
   * @param { Response } res Express response
   * @param { Express.Multer.File } file Express.Multer.File
   */
  public async uploadFiles(
    res: Response,
    imagesMobile: Express.Multer.File[],
    imagesDesktop: Express.Multer.File[],
    blogId: string
  ): Promise<void> {
    // get blog
    const blog = await this.findById(blogId);

    // save desktop images
    if (imagesDesktop && imagesDesktop.length > 0) {
      await this.queue.addJob(
        {
          taskType: "uploadMultipleFiles",
          payload: {
            blog,
            images: imagesDesktop,
            folder: this.folder,
            path: this.path,
            entity: "images",
          },
        },
        {
          attempts: 3,
          backoff: 5000,
        }
      );
    }

    // save mobile images
    if (imagesMobile && imagesMobile.length > 0) {
      await this.queue.addJob(
        {
          taskType: "uploadMultipleFiles",
          payload: {
            blog,
            images: imagesMobile,
            folder: this.folder,
            path: this.path,
            entity: "images",
          },
        },
        {
          attempts: 3,
          backoff: 5000,
        }
      );
    }

    return ResponseHandler.successResponse(res, blog, "Imagenes subidas.");
  }
}
