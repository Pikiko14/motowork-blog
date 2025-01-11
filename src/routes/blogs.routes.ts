import { Router } from "express";
import { upload } from "../utils/storage";
import sessionCheck from "../middlewares/sessions.middleware";
import { BlogsController } from "../controllers/blogs.controller";
import { PaginationValidator } from "../validators/request.validator";
import perMissionMiddleware from "../middlewares/permission.middleware";
import { BlogsCreationValidator, BlogsIdValidator } from "../validators/blogs.validator";

// init router
const router = Router();

// instance controller
const controller = new BlogsController();

/**
 * Create blog
 */
router.post(
  "/",
  sessionCheck,
  perMissionMiddleware("create-blog"),
  upload.single("file"),
  BlogsCreationValidator,
  controller.createBlogs
);

/**
 * Upload files blogs
 */
const uploadFields = upload.fields([
  { name: "imagesMobile", maxCount: 5 },
  { name: "imagesDesktop", maxCount: 5 },
]);
router.post(
  "/upload-files",
  sessionCheck,
  perMissionMiddleware("create-blog"),
  uploadFields,
  BlogsIdValidator,
  controller.uploadFiles
);

/**
 * Get blogs
 */
router.get(
  "/",
  sessionCheck,
  perMissionMiddleware("list-products"),
  PaginationValidator,
  controller.getBlogs
);

// export router
export { router };
