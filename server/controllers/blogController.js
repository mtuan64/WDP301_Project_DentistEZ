const Blog = require("../models/Blog");
const CategoryBlog = require("../models/CategoryBlog");
const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;
const path = require("path");
const slugify = require("slugify");

const uploadDir = path.join(__dirname, "../Uploads");
fs.mkdir(uploadDir, { recursive: true })
  .then(() => console.log("Uploads directory created or exists"))
  .catch((err) => console.error("Error creating uploads directory:", err));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Blog Functions
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "active" })
      .populate("author_id", "fullname email")
      .populate("categoryId", "name");
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Lỗi khi tải danh sách bài viết" });
  }
};

exports.getAllBlogsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 5, categoryId, search } = req.query;
    const query = {};

    // Filter by category if provided
    if (categoryId) {
      query.categoryId = categoryId;
    }

    // Search by title if provided
    if (search) {
      query.title = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // Fetch blogs (both active and inactive) with pagination
    const blogs = await Blog.find(query)
      .populate("author_id", "fullname email")
      .populate("categoryId", "name")
      .skip(skip)
      .limit(pageSize);

    // Get total count for pagination
    const totalBlogs = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalBlogs,
      totalPages: Math.ceil(totalBlogs / pageSize),
      currentPage: pageNumber,
    });
  } catch (error) {
    console.error("Error fetching blogs for admin:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi tải danh sách bài viết cho quản trị viên" });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, status: "active" })
      .populate("author_id", "fullname email")
      .populate("categoryId", "name");
    if (!blog) {
      return res
        .status(404)
        .json({
          message: "Không tìm thấy bài viết hoặc bài viết không hoạt động",
        });
    }
    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    res.status(500).json({ message: "Lỗi khi tải bài viết theo slug" });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, content, categoryId, status } = req.body;
    const author_id = req.user.userId;
    if (!title || !categoryId) {
      return res
        .status(400)
        .json({ message: "Tiêu đề và ID danh mục là bắt buộc" });
    }
    if (!Array.isArray(content) || content.length === 0) {
      return res.status(400).json({ message: "Mảng nội dung là bắt buộc" });
    }
    if (status && !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Giá trị trạng thái không hợp lệ" });
    }
    // Validate category is active
    const category = await CategoryBlog.findById(categoryId);
    if (!category || category.status !== "active") {
      return res
        .status(400)
        .json({ message: "Danh mục không hợp lệ hoặc không hoạt động" });
    }
    const slug = slugify(title, { lower: true, strict: true, locale: "vi" });
    let mainImageUrl = req.body.image || "";
    if (req.files && req.files.mainImage) {
      const result = await cloudinary.uploader.upload(
        req.files.mainImage[0].path,
        { folder: "blog_images" }
      );
      mainImageUrl = result.secure_url;
      await fs.unlink(req.files.mainImage[0].path);
    }
    const processedContent = await Promise.all(
      content.map(async (item, index) => {
        if (
  item.type === "image" &&
  req.files &&
  req.files[`contentImages[${index}]`]
) {
  const contentImage = req.files[`contentImages[${index}]`][0];
  const result = await cloudinary.uploader.upload(contentImage.path, {
    folder: "blog_images",
  });
  await fs.unlink(contentImage.path);
  return { ...item, url: result.secure_url };
}

        return {
          ...item,
          bold: item.bold || false,
          italic: item.italic || false,
          fontSize: item.fontSize || "medium",
        };
      })
    );
    const newBlog = new Blog({
      title,
      content: processedContent,
      author_id,
      image: mainImageUrl,
      slug,
      categoryId,
      status: status || "active",
    });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    if (req.files) {
      await Promise.all(
        Object.values(req.files)
          .flat()
          .map((file) => fs.unlink(file.path).catch(console.error))
      );
    }
    res.status(400).json({ message: "Lỗi khi tạo bài viết" });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId, status } = req.body;
    if (!title || !categoryId) {
      return res
        .status(400)
        .json({ message: "Tiêu đề và ID danh mục là bắt buộc" });
    }
    if (!Array.isArray(content) || content.length === 0) {
      return res.status(400).json({ message: "Mảng nội dung là bắt buộc" });
    }
    if (status && !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Giá trị trạng thái không hợp lệ" });
    }
    // Validate category is active
    const category = await CategoryBlog.findById(categoryId);
    if (!category || category.status !== "active") {
      return res
        .status(400)
        .json({ message: "Danh mục không hợp lệ hoặc không hoạt động" });
    }
    const slug = title
      ? slugify(title, { lower: true, strict: true, locale: "vi" })
      : undefined;
    let mainImageUrl = req.body.image;
    if (req.files && req.files.mainImage) {
      const result = await cloudinary.uploader.upload(
        req.files.mainImage[0].path,
        { folder: "blog_images" }
      );
      mainImageUrl = result.secure_url;
      await fs.unlink(req.files.mainImage[0].path);
    }
    const processedContent = await Promise.all(
      content.map(async (item, index) => {
        if (item.type === "image" && req.files && req.files.contentImages) {
          const contentImage = req.files.contentImages.find(
            (file) => file.fieldname === `contentImages[${index}]`
          );
          if (contentImage) {
            const result = await cloudinary.uploader.upload(contentImage.path, {
              folder: "blog_images",
            });
            await fs.unlink(contentImage.path);
            return { ...item, url: result.secure_url };
          }
        }
        return {
          ...item,
          bold: item.bold || false,
          italic: item.italic || false,
          fontSize: item.fontSize || "medium",
        };
      })
    );
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        content: processedContent,
        image: mainImageUrl,
        slug,
        categoryId,
        status: status || undefined,
        updatedAt: Date.now(),
      },
      { new: true }
    );
    if (!updatedBlog) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }
    res.json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog:", error);
    if (req.files) {
      await Promise.all(
        Object.values(req.files)
          .flat()
          .map((file) => fs.unlink(file.path).catch(console.error))
      );
    }
    res.status(400).json({ message: "Lỗi khi cập nhật bài viết" });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }
    if (blog.status === "active") {
      // Soft delete: set status to inactive
      blog.status = "inactive";
      await blog.save();
      res.json({ message: "Bài viết được đặt thành không hoạt động", blog });
    } else {
      // Permanent delete
      await Blog.findByIdAndDelete(id);
      res.json({ message: "Bài viết đã bị xóa vĩnh viễn" });
    }
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Lỗi khi xóa bài viết" });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res
        .status(400)
        .json({ message: "Không có tệp hình ảnh được cung cấp" });
    }
    const uploadResults = await Promise.all(
      Object.entries(files).flatMap(([fieldName, fileArray]) =>
        fileArray.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "blog_images",
          });
          await fs.unlink(file.path);
          return result.secure_url;
        })
      )
    );
    res.status(200).json({ urls: uploadResults });
  } catch (error) {
    console.error("Cloudinary upload error:", error.message, error.stack);
    if (req.files) {
      await Promise.all(
        Object.values(req.files)
          .flat()
          .map((file) => fs.unlink(file.path).catch(console.error))
      );
    }
    res.status(500).json({
      message: "Không thể tải hình ảnh lên Cloudinary",
      error: error.message,
    });
  }
};

// Category Functions
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryBlog.find({ status: "active" });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Lỗi khi tải danh sách danh mục" });
  }
};

exports.getAllCategoriesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 5, status, search } = req.query;
    const query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // Fetch categories (both active and inactive) with pagination
    const categories = await CategoryBlog.find(query)
      .skip(skip)
      .limit(pageSize);

    // Get total count for pagination
    const totalCategories = await CategoryBlog.countDocuments(query);

    res.json({
      categories,
      totalCategories,
      totalPages: Math.ceil(totalCategories / pageSize),
      currentPage: pageNumber,
    });
  } catch (error) {
    console.error("Error fetching categories for admin:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi tải danh sách danh mục cho quản trị viên" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
    }
    if (status && !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Giá trị trạng thái không hợp lệ" });
    }
    const newCategory = new CategoryBlog({ name, status: status || "active" });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(400).json({ message: "Lỗi khi tạo danh mục" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
    }
    if (status && !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Giá trị trạng thái không hợp lệ" });
    }
    const updatedCategory = await CategoryBlog.findByIdAndUpdate(
      id,
      { name, status: status || "active" },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    // If category is set to inactive, inactivate associated blogs
    if (status === "inactive") {
      await Blog.updateMany({ categoryId: id }, { status: "inactive" });
    }
    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(400).json({ message: "Lỗi khi cập nhật danh mục" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await CategoryBlog.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    if (category.status === "active") {
      // Soft delete: set category and associated blogs to inactive
      category.status = "inactive";
      await category.save();
      await Blog.updateMany({ categoryId: id }, { status: "inactive" });
      res.json({
        message:
          "Danh mục và các bài viết liên quan được đặt thành không hoạt động",
        category,
      });
    } else {
      // Permanent delete
      await CategoryBlog.findByIdAndDelete(id);
      res.json({ message: "Danh mục đã bị xóa vĩnh viễn" });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Lỗi khi xóa danh mục" });
  }
};

exports.getTopViewedBlogs = async (req, res) => {
  try {
    const topBlogs = await Blog.find({ status: "active" })
      .populate("categoryId", "name")
      .sort({ views: -1 })
      .limit(5)
      .select("title content slug image views");
    res.json(topBlogs);
  } catch (error) {
    console.error("Error fetching top viewed blogs:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi tải danh sách bài viết được xem nhiều nhất" });
  }
};

exports.incrementBlogViews = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, status: "active" });
    if (!blog) {
      return res
        .status(404)
        .json({
          message: "Không tìm thấy bài viết hoặc bài viết không hoạt động",
        });
    }
    blog.views = (blog.views || 0) + 1;
    await blog.save();
    res.json({ message: "Số lượt xem đã được tăng", views: blog.views });
  } catch (error) {
    console.error("Error incrementing blog views:", error);
    res.status(500).json({ message: "Lỗi khi tăng số lượt xem bài viết" });
  }
};
