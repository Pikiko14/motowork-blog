import { Response } from "express";
import { ObjectId } from "mongoose";
import { Utils } from "../utils/utils";
import { TaskQueue } from '../queues/cloudinary.queue';
import { RedisImplement } from "./cache/redis.services";
import { CloudinaryService } from "./cloudinary.service";
import { ResponseHandler } from "../utils/responseHandler";
import BlogsRepository from "../repositories/blogs.repository";
import { PaginationInterface } from "../types/req-ext.interface";
import { BlogsImagesInterface, BlogsInterface } from "../types/blogs.interface";

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

      // clear cache
      await this.clearCacheInstances();

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
      // validate in cache
      const redisCache = RedisImplement.getInstance();
      const cacheKey = `blogs:${JSON.stringify(query)}`;
      const cachedData = await redisCache.getItem(cacheKey);
      if (cachedData) {
        return ResponseHandler.successResponse(
          res,
          cachedData,
          "Listado de entradas (desde caché)."
        );
      }

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

      // Guardar la respuesta en Redis por 10 minutos
      await redisCache.setItem(
        cacheKey,
        {
          brands: blogs.data,
          totalItems: blogs.totalItems,
          totalPages: blogs.totalPages,
        },
        600
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
      // validate in cache
      const redisCache = RedisImplement.getInstance();
      const cacheKey = `blogs:${id}`;
      const cachedData = await redisCache.getItem(cacheKey);
      if (cachedData) {
        return ResponseHandler.successResponse(
          res,
          {
            blog:cachedData
          },
          "Información de la entrada (desde caché)."
        );
      }

      // get blog from bbdd
      const blog = await this.findById(id);

      // Guardar la respuesta en Redis por 10 minutos
      await redisCache.setItem(
        cacheKey,
        blog,
        600
      );

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

  /**
   * Delete blog
   * @param { Response } res Express response
   * @param { string } id query of list
   * @return { Promise<void | ResponseRequestInterface> }
   */
  public async deleteBlogs(
    res: Response,
    id: string
  ): Promise<void | ResponseHandler> {
    try {
      //  get product data
      const blog = await this.delete(id);

      // remove data from cache
      await this.clearCacheInstances();

      // return data
      return ResponseHandler.successResponse(
        res,
        {
          blog,
        },
        "Blog eliminado correctamente."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * get similar entries blog
   * @param { Response } res Express response
   * @param { string } id query of list
   * @return { Promise<void | ResponseRequestInterface> }
   */
  public async gatSimilarEntries(
    res: Response,
    id: string
  ): Promise<void | ResponseHandler> {
    try {
      // cache data
      const redisCache = RedisImplement.getInstance();
      const cacheKey = `blogs:similar-${JSON.stringify(id)}`;
      const cachedData = await redisCache.getItem(cacheKey);
      if (cachedData) {
        return ResponseHandler.successResponse(
          res,
          cachedData,
          "Entradas similares (desde caché)."
        );
      }

      //  get blog data
      const blog = await this.findById(id);

      // get similar items
      const similarsItems = await this.gatSimilarItems(blog?.category as string, blog?._id as string);

      // return data
      return ResponseHandler.successResponse(
        res,
        {
          similars: similarsItems,
        },
        "Entradas similares."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // clear cache instances
  public async clearCacheInstances() {
    const redisCache = RedisImplement.getInstance();
    const keys = await redisCache.getKeys("blogs:*");
    if (keys.length > 0) {
      await redisCache.deleteKeys(keys);
      console.log(`🗑️ Cache de blogs limpiado`);
    }
  }

  /**
   * Delete blog image
   * @param { Response } res Express response
   * @param { ProductsInterface } id ProductsInterface
   * @param { string } imageId image id
   */
  public async deleteBlogImage(
    res: Response,
    id: string,
    imageId: string,
  ) {
    try {
      // delete image
      const blog = (await this.findById(id)) as BlogsInterface;
      const images = JSON.parse(JSON.stringify(blog.images));

      const imageToDelete = images.find(
        (item: BlogsImagesInterface) => item._id === imageId
      );

      // delete in cloudinary
      if (imageToDelete) {
        await this.queue.addJob(
          { taskType: "deleteFile", payload: { file: imageToDelete.path } },
          {
            attempts: 3,
            backoff: 5000,
          }
        );
      }

      const newImages = images.filter(
        (item: BlogsImagesInterface) => item._id !== imageId
      );

      // save news images
      blog.images = newImages;
      await this.update(id, blog);

      // clear cache
      await this.clearCacheInstances();

      // return response
      return ResponseHandler.successResponse(
        res,
        newImages,
        "Imagen eliminada correctamente."
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
