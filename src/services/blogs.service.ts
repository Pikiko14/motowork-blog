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

  /**
   * List blogs
   * @param { Response } res Express response
   * @param { PaginationInterface } query query of list
   * @return { Promise<void | ResponseRequestInterface> }
   */
  public async getBlogs(
    res: Response,
    query: PaginationInterface
  ): Promise<void | ResponseHandler> {
    try {
      // validamos la data de la paginacion
      const page: number = (query.page as number) || 1;
      const perPage: number = (query.perPage as number) || 7;
      const skip = (page - 1) * perPage;

      // Iniciar busqueda
      let queryObj: any = {};
      if (query.search) {
        const searchRegex = new RegExp(query.search as string, "i");
        queryObj = {
          $or: [{ title: searchRegex }, { description: searchRegex }],
        };
      }

      // validate filter data
      if (query.filter) {
        const filter = JSON.parse(query.filter);
        queryObj = { ...queryObj, ...filter };
      }
      // do query
      const fields = query.fields ? query.fields.split(",") : [];
      const blogs = await this.paginate(
        queryObj,
        skip,
        perPage,
        query.sortBy,
        query.order,
        fields
      );

      // return data
      return ResponseHandler.successResponse(
        res,
        {
          brands: blogs.data,
          totalItems: blogs.totalItems,
          totalPages: blogs.totalPages,
        },
        "Listado de entradas."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Show blog
   * @param { Response } res Express response
   * @param { string } id query of list
   * @return { Promise<void | ResponseRequestInterface> }
   */
  public async showBlog(
    res: Response,
    id: string
  ): Promise<void | ResponseHandler> {
    try {
      const blog = await this.findById(id);

      // return data
      return ResponseHandler.successResponse(
        res,
        {
          blog,
        },
        "Información de la entrada."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
