import { Utils } from "../utils/utils";
import Bull, { Job, Queue, QueueOptions } from "bull";
import BlogsRepository from "../repositories/blogs.repository";
import { CloudinaryService } from "../services/cloudinary.service";
import { BlogsInterface } from "../types/blogs.interface";

export class TaskQueue<T> extends BlogsRepository {
  private utils: Utils;
  private path: string;
  private queue: Queue<T>;
  public redisConfig: QueueOptions["redis"] = {
    host: '127.0.0.1',
    port: 6379,
  };
  public folder: string = "blogs";
  public cloudinaryService: CloudinaryService;

  constructor(queueName: string, ) {
    super();
    this.queue = new Bull<T>(queueName, {
      redis: this.redisConfig,
    });
    this.path = "/blogs/";
    this.utils = new Utils();
    this.initializeProcessor();
    this.cloudinaryService = new CloudinaryService();
  }

  /**
   * Inicializa el procesador de la cola
   */
  private initializeProcessor() {
    this.queue.process(async (job: Job<T>) => {
      try {
        console.log(`Procesando trabajo: ${job.id}`);
        await this.handleTask(job);
      } catch (error) {
        console.error(`Error procesando trabajo ${job.id}:`, error);
        throw error;
      }
    });
  }

  /**
   * Lógica para manejar cada tarea
   */
  private async handleTask(job: Job<any>): Promise<void> {
    let fileResponse = null;
    let repository = new BlogsRepository();
    let blogEntity: BlogsInterface | null = null;

    // upload multiple files
    let folderString = "";
    if (job.data.taskType === "uploadMultipleFiles") {
      const { blog, images, folder, path, entity } = job.data.payload;
      blogEntity = await repository.findById(blog._id);
      folderString = folder;
      for (const image of images) {
        const imgBuffer = await this.utils.generateBuffer(image.path);
        // delete local storage
        await this.utils.deleteItemFromStorage(
          `${image.path ? `${path}${image.filename}` : ""}`
        );

        // upload single
        fileResponse = await this.cloudinaryService.uploadImage(
          imgBuffer,
          folder
        );

        // save in bbdd
        if (entity === "images" && blogEntity) {
          const imageObj = {
            path: fileResponse.secure_url,
          };
          blogEntity.images.push(imageObj);
          await repository.update(blogEntity._id, blogEntity);
        }
      }
    }

     // delete file
     if (job.data.taskType === "deleteFile") {
      const { file, folder } = job.data.payload;
      folderString = folder;
      fileResponse = await this.cloudinaryService.deleteImageByUrl(file);
    }
    console.log(`Tarea procesada con datos:`, fileResponse);
  }

  /**
   * Agrega un trabajo a la cola
   */
  public async addJob(data: T, options?: Bull.JobOptions): Promise<Job<T>> {
    const job = await this.queue.add(data, options);
    console.log(`Trabajo encolado: ${job.id}`);
    return job;
  }

  /**
   * Configura eventos de la cola
   */
  public setupListeners() {
    this.queue.on("completed", (job: Job) => {
      console.log(`Trabajo completado: ${job.id}`);
    });

    this.queue.on("failed", (job: Job, err: Error) => {
      console.error(`Trabajo fallido: ${job.id}`, err);
    });
  }
}
