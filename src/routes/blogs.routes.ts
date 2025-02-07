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
  perMissionMiddleware("list-blog"),
  PaginationValidator,
  controller.getBlogs
);

/**
 * Show blogs
 */
router.get(
  "/:id",
  sessionCheck,
  perMissionMiddleware("list-blog"),
  BlogsIdValidator,
  controller.showBlog
);

/**
 * Delete blogs
 */
router.delete(
  "/:id",
  sessionCheck,
  perMissionMiddleware("delete-blog"),
  BlogsIdValidator,
  controller.deleteBlogs
);

// export router
export { router };
