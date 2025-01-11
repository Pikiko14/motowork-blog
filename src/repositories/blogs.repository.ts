import { Model } from "mongoose";
import BrandsModel from "../models/blogs.model";
import { BlogsInterface } from "../types/blogs.interface";
import { PaginationResponseInterface } from "../types/response.interface";

class BlogsRepository {
  private readonly model: Model<BlogsInterface>;

  constructor() {
    this.model = BrandsModel;
  }

  /**
   * Find model by query
   * @param query
   * @returns
   */
  public async findOneByQuery(query: any): Promise<BlogsInterface | null> {
    return await this.model.findOne(query);
  }

  /**
   * Save blogs in bbdd
   * @param user User
   */
  public async create(
    blog: BlogsInterface
  ): Promise<BlogsInterface> {
    const blogBd = await this.model.create(blog);
    return blogBd;
  }

  /**
   * Update blog data
   * @param id
   * @param body
   */
  public async update(
    id: string | undefined,
    body: BlogsInterface
  ): Promise<BlogsInterface | void | null> {
    return await this.model.findByIdAndUpdate(id, body, { new: true });
  }

  /**
   * Paginate blogs
   * @param query - Query object for filtering results
   * @param skip - Number of documents to skip
   * @param perPage - Number of documents per page
   * @param sortBy - Field to sort by (default: "name")
   * @param order - Sort order (1 for ascending, -1 for descending, default: "1")
   */
  public async paginate(
    query: Record<string, any>,
    skip: number,
    perPage: number,
    sortBy: string = "title",
    order: any = "-1",
    fields: string[] = []
  ): Promise<PaginationResponseInterface> {
    try {
      // Parse sort order to ensure it is a number

      const validSortFields = ["title", "createdAt"];
      if (!validSortFields.includes(sortBy)) {
        throw new Error(`Invalid sort field. Allowed fields are: ${validSortFields.join(", ")}`);
      }

      // Fetch paginated data
      const blogs = await this.model
        .find(query)
        .sort({ [sortBy]: order })
        .select(fields.length > 0 ? fields.join(' ') : '')
        .skip(skip)
        .limit(perPage);

      // Get total count of matching documents
      const totalBlogs = await this.model.countDocuments(query);

      // Calculate total pages
      const totalPages = Math.ceil(totalBlogs / perPage);

      return {
        data: blogs,
        totalPages,
        totalItems: totalBlogs,
      };
    } catch (error: any) {
      throw new Error(`Pagination failed: ${error.message}`);
    }
  }

  /**
   * Delete blog by id
   * @param id
   */
  public async delete(id: string): Promise<BlogsInterface | void | null> {
    return this.model.findByIdAndDelete(id);
  }

  /**
   * get by id
   * @param id
   */
  public async findById(id: string): Promise<BlogsInterface | null> {
    return await this.model.findById(id);
  }
}

export default BlogsRepository;
