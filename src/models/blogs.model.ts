import { Schema, model, Types } from "mongoose";
import {
  BlogsInterface,
} from "../types/blogs.interface";
import { TaskQueue } from '../queues/cloudinary.queue';

const BlogsSchema = new Schema<BlogsInterface>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
    category: {
      type: String,
      required: false,
      default: '',
    },
    subcategory: {
      type: String,
      required: false,
      default: '',
    },
    more_details: {
      type: String,
      required: false,
      default: '',
    },
    images: [
      {
        path: {
          type: String,
          required: false,
          default: ''
        },
      }
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

BlogsSchema.index({ title: 1 }); // Índice para el campo type

// Middleware para eliminar imágenes antes de borrar un documento
BlogsSchema.pre(
  "findOneAndDelete",
  { document: true, query: true },
  async function (next: any) {
    const queue = new TaskQueue('cloudinary_blogs');
    queue.setupListeners();
    const blog: BlogsInterface = await this.model
      .findOne(this.getQuery())
      .exec();
    try {
      if (blog.images && blog.images.length > 0) {
        for (const item of blog.images) {
          await queue.addJob(
            { taskType: "deleteFile", payload: { file: item.path } },
            {
              attempts: 3,
              backoff: 5000,
            }
          );
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  }
);

const BlogsModel = model<BlogsInterface>(
  "blogs",
  BlogsSchema
);

export default BlogsModel;
