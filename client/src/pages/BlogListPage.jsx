import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormControlLabel,
  Checkbox,
  Box,
  IconButton,
  CircularProgress,
  Pagination,
  Typography,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";
import RemoveIcon from "@mui/icons-material/Remove";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useNavigate } from "react-router-dom";
import "../assets/css/Blog/BlogListPage.css";

const BlogListPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingBlog, setEditingBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({
    title: "",
    content: [],
    image: null,
    imagePreview: null,
    categoryId: "",
    status: "active",
  });
  const [openEditBlog, setOpenEditBlog] = useState(false);
  const [openAddBlog, setOpenAddBlog] = useState(false);
  const [openDeleteBlogDialog, setOpenDeleteBlogDialog] = useState(false);
  const [imageFiles, setImageFiles] = useState({
    mainImage: null,
    contentImages: {},
  });
  const [imagePreviews, setImagePreviews] = useState({
    mainImage: null,
    contentImages: {},
  });
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [deleteBlogType, setDeleteBlogType] = useState("soft");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;
  const navigate = useNavigate();
  const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user && user.role === "admin";
  };

  // Fetch blogs from API (memoized with useCallback)
  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:9999/api/admin/blogs",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: {
            page: currentPage,
            limit: pageSize,
            categoryId: filterCategory,
            search: searchQuery,
          },
        }
      );
      setBlogs(response.data.blogs);
      setTotalBlogs(response.data.totalBlogs);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      setNotification({
        open: true,
        message: `Không thể tải danh sách bài viết: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterCategory, searchQuery]);

  // Fetch categories for filter dropdown (memoized with useCallback)
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/categories", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCategories(response.data);
    } catch (error) {
      setNotification({
        open: true,
        message: `Không thể tải danh sách danh mục: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
    }
  }, []);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if (!isAdmin()) return;
    fetchBlogs();
    fetchCategories();
  }, [fetchBlogs, fetchCategories]);
  // Clean up image previews
  useEffect(() => {
    return () => {
      if (newBlog.imagePreview) URL.revokeObjectURL(newBlog.imagePreview);
      Object.values(imagePreviews.contentImages).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      if (editingBlog?.imagePreview)
        URL.revokeObjectURL(editingBlog.imagePreview);
    };
  }, [newBlog.imagePreview, imagePreviews.contentImages, editingBlog]);

  // Handle image uploads
  const handleUploadImages = async (files) => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Yêu cầu quyền quản trị để tải lên hình ảnh.",
        severity: "error",
      });
      return [];
    }
    const formData = new FormData();
    const totalImages =
      (files.mainImage ? 1 : 0) + Object.keys(files.contentImages).length;
    if (totalImages === 0) return [];
    if (totalImages > 10) {
      setNotification({
        open: true,
        message:
          "Không thể tải lên quá 10 hình ảnh (hình ảnh chính + hình ảnh nội dung).",
        severity: "error",
      });
      return [];
    }
    if (files.mainImage) formData.append("mainImage", files.mainImage);
    Object.values(files.contentImages).forEach((file) => {
      if (file) formData.append("contentImages", file);
    });
    try {
      const response = await axios.post(
        "http://localhost:9999/api/blogs/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Phản hồi tải lên hình ảnh:", response.data);
      return response.data.urls || [];
    } catch (error) {
      setNotification({
        open: true,
        message: `Không thể tải lên hình ảnh: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
      return [];
    }
  };

  // Validate blog data
  const validateBlog = (blog) => {
    if (!blog.title.trim()) {
      setNotification({
        open: true,
        message: "Vui lòng nhập tiêu đề.",
        severity: "error",
      });
      return false;
    }
    if (!blog.categoryId) {
      setNotification({
        open: true,
        message: "Vui lòng chọn danh mục.",
        severity: "error",
      });
      return false;
    }
    const selectedCategory = categories.find(
      (cat) => cat._id === blog.categoryId
    );
    if (!selectedCategory || selectedCategory.status !== "active") {
      setNotification({
        open: true,
        message: "Danh mục đã chọn không hoạt động hoặc không hợp lệ.",
        severity: "error",
      });
      return false;
    }
    if (!blog.content.length) {
      setNotification({
        open: true,
        message: "Vui lòng thêm ít nhất một mục nội dung.",
        severity: "error",
      });
      return false;
    }
    if (!["active", "inactive"].includes(blog.status)) {
      setNotification({
        open: true,
        message: "Trạng thái đã chọn không hợp lệ.",
        severity: "error",
      });
      return false;
    }
    return true;
  };

  // Handle add blog
  const handleAddBlog = async () => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Yêu cầu quyền quản trị để thêm bài viết.",
        severity: "error",
      });
      return;
    }
    setLoading(true);
    try {
      let blogToAdd = { ...newBlog };
      if (!validateBlog(blogToAdd)) {
        setLoading(false);
        return;
      }
      console.log("Thêm bài viết với dữ liệu:", blogToAdd);
      const imageContentItems = newBlog.content.filter(
        (item) => item.type === "image"
      );
      const uploadedContentImages = Object.keys(
        imageFiles.contentImages
      ).length;
      if (
        imageContentItems.length > 0 ||
        uploadedContentImages > 0 ||
        imageFiles.mainImage
      ) {
        const uploadedUrls = await handleUploadImages(imageFiles);
        if (
          uploadedUrls.length === 0 &&
          (uploadedContentImages > 0 || imageFiles.mainImage)
        ) {
          setLoading(false);
          return;
        }
        let urlIndex = 0;
        if (imageFiles.mainImage && uploadedUrls.length > urlIndex) {
          blogToAdd.image = uploadedUrls[urlIndex++];
        }
        let contentImageIndices = Object.keys(imageFiles.contentImages).map(
          Number
        );
        blogToAdd.content = newBlog.content.map((item, index) => {
          if (item.type === "image" && contentImageIndices.includes(index)) {
            const newUrl = uploadedUrls[urlIndex++] || "";
            return { ...item, url: newUrl };
          }
          return item;
        });
      }
      const response = await axios.post(
        "http://localhost:9999/api/blogs",
        {
          title: blogToAdd.title,
          content: blogToAdd.content,
          image: blogToAdd.image,
          categoryId: blogToAdd.categoryId,
          status: blogToAdd.status,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      console.log("Phản hồi thêm bài viết:", response.data);
      if (currentPage === 1) {
        setBlogs([response.data, ...blogs].slice(0, pageSize));
        setTotalBlogs(totalBlogs + 1);
        setTotalPages(Math.ceil((totalBlogs + 1) / pageSize));
      }
      setNewBlog({
        title: "",
        content: [],
        image: null,
        imagePreview: null,
        categoryId: "",
        status: "active",
      });
      setImageFiles({ mainImage: null, contentImages: {} });
      setImagePreviews({ mainImage: null, contentImages: {} });
      setOpenAddBlog(false);
      setNotification({
        open: true,
        message: "Thêm bài viết thành công!",
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `Không thể thêm bài viết: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle update blog
  const handleUpdateBlog = async () => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Yêu cầu quyền quản trị để cập nhật bài viết.",
        severity: "error",
      });
      return;
    }
    setLoading(true);
    try {
      let updatedBlog = { ...editingBlog };
      if (!validateBlog(updatedBlog)) {
        setLoading(false);
        return;
      }
      console.log("Cập nhật bài viết với dữ liệu:", updatedBlog);
      const imageContentItems = updatedBlog.content.filter(
        (item) => item.type === "image"
      );
      const uploadedContentImages = Object.keys(
        imageFiles.contentImages
      ).length;
      if (
        imageContentItems.length > 0 ||
        uploadedContentImages > 0 ||
        imageFiles.mainImage
      ) {
        const uploadedUrls = await handleUploadImages(imageFiles);
        if (
          uploadedUrls.length === 0 &&
          (uploadedContentImages > 0 || imageFiles.mainImage)
        ) {
          setLoading(false);
          return;
        }
        let urlIndex = 0;
        if (imageFiles.mainImage && uploadedUrls.length > urlIndex) {
          updatedBlog.image = uploadedUrls[urlIndex++];
        }
        let contentImageIndices = Object.keys(imageFiles.contentImages).map(
          Number
        );
        updatedBlog.content = updatedBlog.content.map((item, index) => {
          if (item.type === "image" && contentImageIndices.includes(index)) {
            const newUrl = uploadedUrls[urlIndex++] || item.url;
            return { ...item, url: newUrl };
          }
          return item;
        });
      }
      const response = await axios.put(
        `http://localhost:9999/api/blogs/${editingBlog._id}`,
        {
          title: updatedBlog.title,
          content: updatedBlog.content,
          image: updatedBlog.image,
          categoryId: updatedBlog.categoryId,
          status: updatedBlog.status,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      console.log("Phản hồi cập nhật bài viết:", response.data);
      setBlogs(
        blogs.map((blog) =>
          blog._id === editingBlog._id ? response.data : blog
        )
      );
      setEditingBlog(null);
      setImageFiles({ mainImage: null, contentImages: {} });
      setImagePreviews({ mainImage: null, contentImages: {} });
      setOpenEditBlog(false);
      setNotification({
        open: true,
        message: "Cập nhật bài viết thành công!",
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `Không thể cập nhật bài viết: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete blog
  const handleDeleteBlog = async () => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Yêu cầu quyền quản trị để xóa bài viết.",
        severity: "error",
      });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.delete(
        `http://localhost:9999/api/blogs/${blogToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: { permanent: deleteBlogType === "permanent" },
        }
      );
      console.log("Phản hồi xóa bài viết:", response.data);
      if (deleteBlogType === "soft") {
        setBlogs(
          blogs.map((blog) =>
            blog._id === blogToDelete._id
              ? { ...blog, status: "inactive" }
              : blog
          )
        );
      } else {
        setBlogs(blogs.filter((blog) => blog._id !== blogToDelete._id));
        setTotalBlogs(totalBlogs - 1);
        setTotalPages(Math.ceil((totalBlogs - 1) / pageSize));
        if (blogs.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      }
      setOpenDeleteBlogDialog(false);
      setBlogToDelete(null);
      setNotification({
        open: true,
        message: response.data.message,
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `Không thể xóa bài viết: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle modal open/close
  const handleOpenEditBlog = (blog) => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Yêu cầu quyền quản trị để chỉnh sửa bài viết.",
        severity: "error",
      });
      return;
    }
    setEditingBlog({
      _id: blog._id,
      title: blog.title,
      content: blog.content || [],
      image: blog.image,
      imagePreview: blog.image,
      categoryId: blog.categoryId?._id || blog.categoryId,
      status: blog.status || "active",
    });
    setOpenEditBlog(true);
  };

  const handleCloseEditBlog = () => {
    setOpenEditBlog(false);
    setEditingBlog(null);
    setImageFiles({ mainImage: null, contentImages: {} });
    setImagePreviews({ mainImage: null, contentImages: {} });
  };

  const handleOpenAddBlog = () => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Yêu cầu quyền quản trị để thêm bài viết.",
        severity: "error",
      });
      return;
    }
    setNewBlog({
      title: "",
      content: [],
      image: null,
      imagePreview: null,
      categoryId: "",
      status: "active",
    });
    setImageFiles({ mainImage: null, contentImages: {} });
    setImagePreviews({ mainImage: null, contentImages: {} });
    setOpenAddBlog(true);
  };

  const handleCloseAddBlog = () => {
    setOpenAddBlog(false);
    setNewBlog({
      title: "",
      content: [],
      image: null,
      imagePreview: null,
      categoryId: "",
      status: "active",
    });
    setImageFiles({ mainImage: null, contentImages: {} });
    setImagePreviews({ mainImage: null, contentImages: {} });
  };

  const handleOpenDeleteBlogDialog = (blog) => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Yêu cầu quyền quản trị để xóa bài viết.",
        severity: "error",
      });
      return;
    }
    setBlogToDelete(blog);
    setDeleteBlogType(blog.status === "active" ? "soft" : "permanent");
    setOpenDeleteBlogDialog(true);
  };

  const handleCloseDeleteBlogDialog = () => {
    setOpenDeleteBlogDialog(false);
    setBlogToDelete(null);
    setDeleteBlogType("soft");
  };

  // Handle content item changes
  const handleAddContentItem = () => {
    const targetState = openEditBlog ? setEditingBlog : setNewBlog;
    targetState((prev) => ({
      ...prev,
      content: [
        ...prev.content,
        {
          type: "paragraph",
          text: "",
          url: "",
          bold: false,
          italic: false,
          fontSize: "medium",
        },
      ],
    }));
  };

  const handleRemoveContentItem = (index) => {
    const targetState = openEditBlog ? setEditingBlog : setNewBlog;
    targetState((prev) => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index),
    }));
    setImageFiles((prev) => {
      const newContentImages = { ...prev.contentImages };
      delete newContentImages[index];
      return { ...prev, contentImages: newContentImages };
    });
    setImagePreviews((prev) => {
      const newContentPreviews = { ...prev.contentImages };
      delete newContentPreviews[index];
      return { ...prev, contentImages: newContentPreviews };
    });
  };

  const handleContentChange = (index, field, value) => {
    const targetState = openEditBlog ? setEditingBlog : setNewBlog;
    targetState((prev) => ({
      ...prev,
      content: prev.content.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleImageChange = (index, file) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImageFiles((prev) => ({
        ...prev,
        fractionationImages: { ...prev.contentImages, [index]: file },
      }));
      setImagePreviews((prev) => ({
        ...prev,
        contentImages: { ...prev.contentImages, [index]: previewUrl },
      }));
      const targetState = openEditBlog ? setEditingBlog : setNewBlog;
      targetState((prev) => ({
        ...prev,
        content: prev.content.map((item, i) =>
          i === index ? { ...item, url: previewUrl } : item
        ),
      }));
    }
  };

  const handleMainImageChange = (file) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImageFiles((prev) => ({ ...prev, mainImage: file }));
      setImagePreviews((prev) => ({ ...prev, mainImage: previewUrl }));
      const targetState = openEditBlog ? setEditingBlog : setNewBlog;
      targetState((prev) => ({
        ...prev,
        image: previewUrl,
        imagePreview: previewUrl,
      }));
    }
  };

  const handleCloseNotification = () => {
    setNotification({ open: false, message: "", severity: "success" });
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  return (
    <div className="blog-list-page">
      <h1>Quản Lý Bài Viết</h1>
      <Box className="filter-search-container">
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-category-label">Lọc theo Danh Mục</InputLabel>
          <Select
            labelId="filter-category-label"
            value={filterCategory}
            label="Lọc theo Danh Mục"
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            startAdornment={
              <InputAdornment position="start">
                <FilterAltIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="">
              <em>Tất Cả Danh Mục</em>
            </MenuItem>
            {categories
              .filter((category) => category.status === "active")
              .map((category) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <TextField
          label="Tìm kiếm theo Tiêu Đề"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          my: 2,
        }}
      >
        <Typography className="showing-info">
          Hiển thị {blogs.length} / {totalBlogs} Bài Viết
        </Typography>
        {isAdmin() && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAddBlog}
              disabled={loading}
            >
              Thêm Bài Viết
            </Button>
            <Button
              variant="contained"
              color="primary"
              className="navigation-button"
              startIcon={<CategoryIcon />}
              onClick={() => {
                console.log("Điều hướng đến /admin/categories");
                navigate("/admin/categories");
              }}
              disabled={loading}
            >
              Danh Mục Bài Viết
            </Button>
          </Box>
        )}
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : blogs.length === 0 ? (
        <Typography sx={{ textAlign: "center", my: 4 }}>
          Không tìm thấy bài viết nào.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="stt"></TableCell>
                <TableCell className="title">Tiêu Đề</TableCell>
                <TableCell className="content">Nội Dung</TableCell>
                <TableCell>Hình Ảnh</TableCell>
                <TableCell className="category">Danh Mục</TableCell>
                <TableCell className="slug">Slug</TableCell>
                <TableCell className="status">Trạng Thái</TableCell>
                {isAdmin() && (
                  <TableCell className="actions">Hành Động</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {blogs.map((blog, index) => {
                const categoryIdValue = blog.categoryId?._id || blog.categoryId;
                const categoryName =
                  blog.categoryId?.name ||
                  categories.find((cat) => cat._id === categoryIdValue)?.name ||
                  "N/A";
                return (
                  <TableRow key={blog._id}>
                    <TableCell className="stt">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="title">{blog.title}</TableCell>
                    <TableCell className="content">
                      {blog.content
                        ?.map(
                          (item) =>
                            `${item.type}: ${item.text || item.url || "N/A"}`
                        )
                        .join(", ") || "N/A"}
                    </TableCell>
                    <TableCell>
                      {blog.image && (
                        <img
                          src={blog.image}
                          alt={blog.title}
                          style={{ width: "50px" }}
                        />
                      )}
                    </TableCell>
                    <TableCell className="category">{categoryName}</TableCell>
                    <TableCell className="slug">{blog.slug}</TableCell>
                    <TableCell
                      className={`status ${blog.status.toLowerCase()}`}
                    >
                      {blog.status === "active" ? "Hoạt động" : "Không hoạt động"}
                    </TableCell>
                    {isAdmin() && (
                      <TableCell className="actions">
                        <Button
                          color="primary"
                          onClick={() => handleOpenEditBlog(blog)}
                          startIcon={<EditIcon />}
                          disabled={loading}
                        />
                        <Button
                          color="secondary"
                          onClick={() => handleOpenDeleteBlogDialog(blog)}
                          startIcon={<DeleteIcon />}
                          disabled={loading}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {totalPages > 1 && (
        <Box className="pagination-container">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      <Dialog
        open={openAddBlog}
        onClose={handleCloseEditBlog}
        maxWidth="md"
        fullWidth
        className="blog-dialog"
        PaperProps={{
          sx: {
            maxHeight: "70vh",
          },
        }}
        sx={{ zIndex: 1300 }}
      >
        <DialogTitle>Thêm Bài Viết Mới</DialogTitle>
        <DialogContent
          sx={{
            maxHeight: "70vh",
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {loading && (
            <div className="custom-loading-overlay">
              <CircularProgress />
            </div>
          )}
          <Box className="blog-form">
            <TextField
              sx={{ mt: 2 }}
              autoFocus
              label="Tiêu Đề"
              variant="outlined"
              fullWidth
              value={newBlog.title}
              onChange={(e) =>
                setNewBlog({ ...newBlog, title: e.target.value })
              }
              className="form-field"
            />
            <Box className="content-section">
              <Typography variant="subtitle1" gutterBottom>
                Nội Dung
              </Typography>
              {newBlog.content.map((item, index) => (
                <Box key={index} className="content-item">
                  <FormControl fullWidth className="form-field">
                    <InputLabel>Loại</InputLabel>
                    <Select
                      value={item.type}
                      label="Loại"
                      onChange={(e) =>
                        handleContentChange(index, "type", e.target.value)
                      }
                    >
                      <MenuItem value="paragraph">Đoạn văn</MenuItem>
                      <MenuItem value="bullet">Dấu đầu dòng</MenuItem>
                      <MenuItem value="image">Hình ảnh</MenuItem>
                    </Select>
                  </FormControl>
                  {item.type !== "image" ? (
                    <>
                      <TextField
                        label="Văn Bản"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        value={item.text || ""}
                        onChange={(e) =>
                          handleContentChange(index, "text", e.target.value)
                        }
                        className="form-field"
                      />
                      <Box className="content-options">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={item.bold || false}
                              onChange={(e) =>
                                handleContentChange(
                                  index,
                                  "bold",
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label="In Đậm"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={item.italic || false}
                              onChange={(e) =>
                                handleContentChange(
                                  index,
                                  "italic",
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label="In Nghiêng"
                        />
                        <FormControl className="font-size-select">
                          <InputLabel>Kích Thước Chữ</InputLabel>
                          <Select
                            value={item.fontSize || "medium"}
                            label="Kích Thước Chữ"
                            onChange={(e) =>
                              handleContentChange(
                                index,
                                "fontSize",
                                e.target.value
                              )
                            }
                          >
                            <MenuItem value="small">Nhỏ</MenuItem>
                            <MenuItem value="medium">Trung bình</MenuItem>
                            <MenuItem value="large">Lớn</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </>
                  ) : (
                    <Box className="image-upload">
                      <Button
                        variant="outlined"
                        component="label"
                        className="upload-button"
                      >
                        Tải Lên Hình Ảnh
                        <input
                          type="file"
                          hidden
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) =>
                            handleImageChange(index, e.target.files[0])
                          }
                        />
                      </Button>
                      {(item.url || imagePreviews.contentImages[index]) && (
                        <img
                          src={imagePreviews.contentImages[index] || item.url}
                          alt={`Nội dung ${index}`}
                          className="preview-image"
                        />
                      )}
                    </Box>
                  )}
                  <Box className="content-actions">
                    <IconButton
                      color="secondary"
                      onClick={() => handleRemoveContentItem(index)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={handleAddContentItem}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              {!newBlog.content.length && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddContentItem}
                  className="add-content-button"
                >
                  Thêm Nội Dung
                </Button>
              )}
            </Box>
            <FormControl fullWidth className="form-field">
              <InputLabel>Danh Mục</InputLabel>
              <Select
                value={newBlog.categoryId}
                label="Danh Mục"
                onChange={(e) =>
                  setNewBlog({ ...newBlog, categoryId: e.target.value })
                }
              >
                <MenuItem value="">
                  <em>Chọn danh mục</em>
                </MenuItem>
                {categories
                  .filter((category) => category.status === "active")
                  .map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth className="form-field">
              <InputLabel>Trạng Thái</InputLabel>
              <Select
                value={newBlog.status}
                label="Trạng Thái"
                onChange={(e) => {
                  console.log("Trạng thái bài viết mới thay đổi thành:", e.target.value);
                  setNewBlog({ ...newBlog, status: e.target.value });
                }}
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Không hoạt động</MenuItem>
              </Select>
            </FormControl>
            <Box className="image-upload">
              <Typography variant="subtitle1" gutterBottom>
                Hình Ảnh Chính
              </Typography>
              <Button
                variant="outlined"
                component="label"
                className="upload-button"
              >
                Tải Lên Hình Ảnh Chính
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleMainImageChange(e.target.files[0])}
                />
              </Button>
              {(newBlog.image || imagePreviews.mainImage) && (
                <img
                  src={imagePreviews.mainImage || newBlog.image}
                  alt="Hình Ảnh Chính"
                  className="preview-image"
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddBlog} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddBlog}
            disabled={loading}
          >
            Thêm Bài Viết
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openEditBlog}
        onClose={handleCloseEditBlog}
        maxWidth="md"
        fullWidth
        className="blog-dialog"
        PaperProps={{
          sx: {
            maxHeight: "70vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
        sx={{ zIndex: 1300 }}
      >
        <DialogTitle
          sx={{
            padding: "10px 24px",
            minHeight: "60px",
            display: "flex",
            alignItems: "center",
          }}
        >
          Chỉnh Sửa Bài Viết
        </DialogTitle>
        <DialogContent
          sx={{
            padding: "20px 24px",
            paddingTop: "80px",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {loading && (
            <div className="custom-loading-overlay">
              <CircularProgress />
            </div>
          )}
          <Box className="blog-form">
            <TextField
              sx={{ mt: 2 }}
              autoFocus
              label="Tiêu Đề"
              variant="outlined"
              fullWidth
              value={editingBlog?.title || ""}
              onChange={(e) =>
                setEditingBlog({ ...editingBlog, title: e.target.value })
              }
              className="form-field"
            />
            <Box className="content-section">
              <Typography variant="subtitle1" gutterBottom>
                Nội Dung
              </Typography>
              {editingBlog?.content.map((item, index) => (
                <Box key={index} className="content-item">
                  <FormControl fullWidth className="form-field">
                    <InputLabel>Loại</InputLabel>
                    <Select
                      value={item.type}
                      label="Loại"
                      onChange={(e) =>
                        handleContentChange(index, "type", e.target.value)
                      }
                    >
                      <MenuItem value="paragraph">Đoạn văn</MenuItem>
                      <MenuItem value="bullet">Dấu đầu dòng</MenuItem>
                      <MenuItem value="image">Hình ảnh</MenuItem>
                    </Select>
                  </FormControl>
                  {item.type !== "image" ? (
                    <>
                      <TextField
                        label="Văn Bản"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        value={item.text || ""}
                        onChange={(e) =>
                          handleContentChange(index, "text", e.target.value)
                        }
                        className="form-field"
                      />
                      <Box className="content-options">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={item.bold || false}
                              onChange={(e) =>
                                handleContentChange(
                                  index,
                                  "bold",
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label="In Đậm"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={item.italic || false}
                              onChange={(e) =>
                                handleContentChange(
                                  index,
                                  "italic",
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label="In Nghiêng"
                        />
                        <FormControl className="font-size-select">
                          <InputLabel>Kích Thước Chữ</InputLabel>
                          <Select
                            value={item.fontSize || "medium"}
                            label="Kích Thước Chữ"
                            onChange={(e) =>
                              handleContentChange(
                                index,
                                "fontSize",
                                e.target.value
                              )
                            }
                          >
                            <MenuItem value="small">Nhỏ</MenuItem>
                            <MenuItem value="medium">Trung bình</MenuItem>
                            <MenuItem value="large">Lớn</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </>
                  ) : (
                    <Box className="image-upload">
                      <Button
                        variant="outlined"
                        component="label"
                        className="upload-button"
                      >
                        Tải Lên Hình Ảnh
                        <input
                          type="file"
                          hidden
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) =>
                            handleImageChange(index, e.target.files[0])
                          }
                        />
                      </Button>
                      {(item.url || imagePreviews.contentImages[index]) && (
                        <img
                          src={imagePreviews.contentImages[index] || item.url}
                          alt={`Nội dung ${index}`}
                          className="preview-image"
                        />
                      )}
                    </Box>
                  )}
                  <Box className="content-actions">
                    <IconButton
                      color="secondary"
                      onClick={() => handleRemoveContentItem(index)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={handleAddContentItem}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              {!editingBlog?.content.length && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddContentItem}
                  className="add-content-button"
                >
                  Thêm Nội Dung
                </Button>
              )}
            </Box>
            <FormControl fullWidth className="form-field">
              <InputLabel>Danh Mục</InputLabel>
              <Select
                value={editingBlog?.categoryId || ""}
                label="Danh Mục"
                onChange={(e) =>
                  setEditingBlog({ ...editingBlog, categoryId: e.target.value })
                }
              >
                <MenuItem value="">
                  <em>Chọn danh mục</em>
                </MenuItem>
                {categories
                  .filter((category) => category.status === "active")
                  .map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth className="form-field">
              <InputLabel>Trạng Thái</InputLabel>
              <Select
                value={editingBlog?.status || "active"}
                label="Trạng Thái"
                onChange={(e) => {
                  console.log(
                    "Trạng thái bài viết đang chỉnh sửa thay đổi thành:",
                    e.target.value
                  );
                  setEditingBlog({ ...editingBlog, status: e.target.value });
                }}
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Không hoạt động</MenuItem>
              </Select>
            </FormControl>
            <Box className="image-upload">
              <Typography variant="subtitle1" gutterBottom>
                Hình Ảnh Chính
              </Typography>
              <Button
                variant="outlined"
                component="label"
                className="upload-button"
              >
                Tải Lên Hình Ảnh Chính
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleMainImageChange(e.target.files[0])}
                />
              </Button>
              {(editingBlog?.image || imagePreviews.mainImage) && (
                <img
                  src={imagePreviews.mainImage || editingBlog.image}
                  alt="Hình Ảnh Chính"
                  className="preview-image"
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditBlog} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateBlog}
            disabled={loading}
          >
            Cập Nhật
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDeleteBlogDialog}
        onClose={handleCloseDeleteBlogDialog}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 1300 }}
      >
        <DialogTitle>Xóa Bài Viết</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteBlogType === "soft"
              ? "Sau khi xóa, trạng thái bài viết sẽ được đặt thành không hoạt động."
              : "Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này không?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteBlogDialog} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteBlog}
            disabled={loading}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={notification.open}
        onClose={handleCloseNotification}
        maxWidth="xs"
        fullWidth
        className={`notification-dialog ${notification.severity}`}
        sx={{ zIndex: 1300 }}
      >
        <DialogContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {notification.severity === "success" ? (
            <CheckCircleIcon />
          ) : (
            <ErrorIcon />
          )}
          <DialogContentText>{notification.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotification} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BlogListPage;