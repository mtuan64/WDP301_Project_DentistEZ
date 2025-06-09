import React, { useEffect, useState } from "react";
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
  Tab,
  Tabs,
  Box,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import "../assets/css/Blog/BlogListPage.css";

const BlogListPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingBlog, setEditingBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({
    title: "",
    content: [
      {
        type: "paragraph",
        text: "",
        url: "",
        bold: false,
        italic: false,
        fontSize: "medium",
      },
    ],
    image: "",
    categoryId: "",
  });
  const [openEditBlog, setOpenEditBlog] = useState(false);
  const [openAddBlog, setOpenAddBlog] = useState(false);
  const [openDeleteBlogConfirm, setOpenDeleteBlogConfirm] = useState(false);
  const [imageFiles, setImageFiles] = useState({
    mainImage: null,
    contentImages: {},
  });
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [openEditCategory, setOpenEditCategory] = useState(false);
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [openDeleteCategoryConfirm, setOpenDeleteCategoryConfirm] =
    useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || !user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchBlogs();
    fetchCategories();
  }, [navigate]);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/blogs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBlogs(response.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      alert(
        "Failed to fetch blogs: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/categories", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert(
        "Failed to fetch categories: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleUploadImages = async (files) => {
    const formData = new FormData();
    const totalImages =
      (files.mainImage ? 1 : 0) + Object.keys(files.contentImages).length;
    if (totalImages === 0) return [];
    if (totalImages > 10) {
      alert("Cannot upload more than 10 images (main image + content images).");
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
      return response.data.urls || [];
    } catch (error) {
      console.error("Error uploading images:", error.response?.data || error);
      alert(
        "Failed to upload images: " +
          (error.response?.data?.message || error.message)
      );
      return [];
    }
  };

  const handleAddBlog = async () => {
    setLoading(true);
    try {
      let blogToAdd = { ...newBlog };
      if (!newBlog.title.trim()) {
        alert("Please enter a title.");
        setLoading(false);
        return;
      }
      if (!newBlog.categoryId) {
        alert("Please select a category.");
        setLoading(false);
        return;
      }
      if (!newBlog.content.length) {
        alert("Please add at least one content item.");
        setLoading(false);
        return;
      }
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
          alert("Image upload failed. Please try again.");
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
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setBlogs([...blogs, response.data]);
      setNewBlog({
        title: "",
        content: [
          {
            type: "paragraph",
            text: "",
            url: "",
            bold: false,
            italic: false,
            fontSize: "medium",
          },
        ],
        image: "",
        categoryId: "",
      });
      setImageFiles({ mainImage: null, contentImages: {} });
      setOpenAddBlog(false);
      setSuccessMessage("Blog added successfully!");
    } catch (error) {
      console.error("Error adding blog:", error.response?.data || error);
      alert(
        "Failed to add blog: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBlog = async () => {
    setLoading(true);
    try {
      let updatedBlog = { ...editingBlog };
      if (!updatedBlog.title.trim()) {
        alert("Please enter a title.");
        setLoading(false);
        return;
      }
      if (!updatedBlog.categoryId) {
        alert("Please select a category.");
        setLoading(false);
        return;
      }
      if (!updatedBlog.content.length) {
        alert("Please add at least one content item.");
        setLoading(false);
        return;
      }
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
          alert("Image upload failed. Please try again.");
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
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setBlogs(
        blogs.map((blog) =>
          blog._id === editingBlog._id ? response.data : blog
        )
      );
      setEditingBlog(null);
      setOpenEditBlog(false);
      setImageFiles({ mainImage: null, contentImages: {} });
      setSuccessMessage("Blog updated successfully!");
    } catch (error) {
      console.error("Error updating blog:", error.response?.data || error);
      alert(
        "Failed to update blog: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `http://localhost:9999/api/blogs/${blogToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setBlogs(blogs.filter((blog) => blog._id !== blogToDelete._id));
      setOpenDeleteBlogConfirm(false);
      setBlogToDelete(null);
      setSuccessMessage("Blog deleted successfully!");
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert(
        "Failed to delete blog: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    setLoading(true);
    try {
      if (!newCategory.name.trim()) {
        alert("Please enter a category name.");
        setLoading(false);
        return;
      }
      const response = await axios.post(
        "http://localhost:9999/api/categories",
        { name: newCategory.name },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setCategories([...categories, response.data]);
      setNewCategory({ name: "" });
      setOpenAddCategory(false);
      setSuccessMessage("Category added successfully!");
    } catch (error) {
      console.error("Error adding category:", error);
      alert(
        "Failed to add category: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    setLoading(true);
    try {
      if (!editingCategory.name.trim()) {
        alert("Please enter a category name.");
        setLoading(false);
        return;
      }
      const response = await axios.put(
        `http://localhost:9999/api/categories/${editingCategory._id}`,
        { name: editingCategory.name },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setCategories(
        categories.map((category) =>
          category._id === editingCategory._id ? response.data : category
        )
      );
      setEditingCategory(null);
      setOpenEditCategory(false);
      setSuccessMessage("Category updated successfully!");
    } catch (error) {
      console.error("Error updating category:", error);
      alert(
        "Failed to update category: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `http://localhost:9999/api/categories/${categoryToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setCategories(
        categories.filter((category) => category._id !== categoryToDelete._id)
      );
      setOpenDeleteCategoryConfirm(false);
      setCategoryToDelete(null);
      setSuccessMessage("Category deleted successfully!");
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(
        "Failed to delete category: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditBlog = (blog) => {
    setEditingBlog({
      _id: blog._id,
      title: blog.title,
      content: blog.content || [
        {
          type: "paragraph",
          text: "",
          url: "",
          bold: false,
          italic: false,
          fontSize: "medium",
        },
      ],
      image: blog.image,
      categoryId: blog.categoryId?._id || blog.categoryId,
    });
    setOpenEditBlog(true);
  };

  const handleCloseEditBlog = () => {
    setOpenEditBlog(false);
    setEditingBlog(null);
    setImageFiles({ mainImage: null, contentImages: {} });
  };

  const handleOpenAddBlog = () => {
    setOpenAddBlog(true);
  };

  const handleCloseAddBlog = () => {
    setOpenAddBlog(false);
    setNewBlog({
      title: "",
      content: [
        {
          type: "paragraph",
          text: "",
          url: "",
          bold: false,
          italic: false,
          fontSize: "medium",
        },
      ],
      image: "",
      categoryId: "",
    });
    setImageFiles({ mainImage: null, contentImages: {} });
  };

  const handleOpenDeleteBlogConfirm = (blog) => {
    setBlogToDelete(blog);
    setOpenDeleteBlogConfirm(true);
  };

  const handleCloseDeleteBlogConfirm = () => {
    setOpenDeleteBlogConfirm(false);
    setBlogToDelete(null);
  };

  const handleOpenEditCategory = (category) => {
    setEditingCategory({ _id: category._id, name: category.name });
    setOpenEditCategory(true);
  };

  const handleCloseEditCategory = () => {
    setOpenEditCategory(false);
    setEditingCategory(null);
  };

  const handleOpenAddCategory = () => {
    setOpenAddCategory(true);
  };

  const handleCloseAddCategory = () => {
    setOpenAddCategory(false);
    setNewCategory({ name: "" });
  };

  const handleOpenDeleteCategoryConfirm = (category) => {
    setCategoryToDelete(category);
    setOpenDeleteCategoryConfirm(true);
  };

  const handleCloseDeleteCategoryConfirm = () => {
    setOpenDeleteCategoryConfirm(false);
    setCategoryToDelete(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddContentItem = (type) => {
    if (tabValue === 0 && (openEditBlog || openAddBlog)) {
      const targetState = openEditBlog ? setEditingBlog : setNewBlog;
      targetState((prev) => ({
        ...prev,
        content: [
          ...prev.content,
          {
            type,
            text: "",
            url: "",
            bold: false,
            italic: false,
            fontSize: "medium",
          },
        ],
      }));
    }
  };

  const handleRemoveContentItem = (index) => {
    if (tabValue === 0 && (openEditBlog || openAddBlog)) {
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
    }
  };

  const handleContentChange = (index, field, value) => {
    if (tabValue === 0 && (openEditBlog || openAddBlog)) {
      const targetState = openEditBlog ? setEditingBlog : setNewBlog;
      targetState((prev) => ({
        ...prev,
        content: prev.content.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      }));
    }
  };

  const handleImageChange = (index, file) => {
    setImageFiles((prev) => ({
      ...prev,
      contentImages: { ...prev.contentImages, [index]: file },
    }));
  };

  const handleMainImageChange = (file) => {
    setImageFiles((prev) => ({ ...prev, mainImage: file }));
  };

  const handleCloseSuccess = () => {
    setSuccessMessage("");
  };

  // Lọc và tìm kiếm blogs
  const filteredBlogs = blogs.filter((blog) => {
    const matchesCategory =
      !filterCategory || blog.categoryId?._id === filterCategory;
    const matchesSearch =
      !searchQuery ||
      blog.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="blog-list-page">
      <h1>Blog Management</h1>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin tabs"
        >
          <Tab label="Manage Blogs" />
          <Tab label="Manage Categories" />
        </Tabs>
      </Box>
      {tabValue === 0 && (
        <>
          <Box className="filter-search-container">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Search by Title"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
              sx={{ flexGrow: 1 }}
            />
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddBlog}
            disabled={loading}
          >
            Add Blog
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className="title">Title</TableCell>
                  <TableCell className="content">Content</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell className="category">Category</TableCell>
                  <TableCell className="slug">Slug</TableCell>
                  <TableCell className="actions">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBlogs.map((blog) => {
                  const categoryIdValue =
                    blog.categoryId?._id || blog.categoryId;
                  const categoryName =
                    blog.categoryId?.name ||
                    categories.find((cat) => cat._id === categoryIdValue)
                      ?.name ||
                    "N/A";
                  return (
                    <TableRow key={blog._id}>
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
                      <TableCell className="actions">
                        <Button
                          color="primary"
                          onClick={() => handleOpenEditBlog(blog)}
                          startIcon={<EditIcon />}
                          disabled={loading}
                        />
                        <Button
                          color="secondary"
                          onClick={() => handleOpenDeleteBlogConfirm(blog)}
                          startIcon={<DeleteIcon />}
                          disabled={loading}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Edit Blog Dialog */}
          <Dialog
            open={openEditBlog}
            onClose={handleCloseEditBlog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Edit Blog</DialogTitle>
            <DialogContent>
              {loading && (
                <div className="custom-loading-overlay">
                  <CircularProgress />
                </div>
              )}
              <Box sx={{ mb: 2 }}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Title"
                  type="text"
                  fullWidth
                  value={editingBlog?.title || ""}
                  onChange={(e) =>
                    setEditingBlog({ ...editingBlog, title: e.target.value })
                  }
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                {editingBlog?.content?.map((item, index) => (
                  <Box
                    key={index}
                    className="custom-edit-section"
                    sx={{ mb: 2, p: 2, borderRadius: 4 }}
                  >
                    <FormControl fullWidth margin="dense">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={item.type}
                        onChange={(e) =>
                          handleContentChange(index, "type", e.target.value)
                        }
                      >
                        <MenuItem value="paragraph">Paragraph</MenuItem>
                        <MenuItem value="bullet">Bullet</MenuItem>
                        <MenuItem value="image">Image</MenuItem>
                      </Select>
                    </FormControl>
                    {item.type !== "image" ? (
                      <>
                        <TextField
                          margin="dense"
                          label="Text"
                          type="text"
                          fullWidth
                          value={item.text || ""}
                          onChange={(e) =>
                            handleContentChange(index, "text", e.target.value)
                          }
                          sx={{ mt: 1 }}
                        />
                        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
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
                            label="Bold"
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
                            label="Italic"
                          />
                        </Box>
                        <FormControl fullWidth margin="dense" sx={{ mt: 1 }}>
                          <InputLabel>Font Size</InputLabel>
                          <Select
                            value={item.fontSize || "medium"}
                            onChange={(e) =>
                              handleContentChange(
                                index,
                                "fontSize",
                                e.target.value
                              )
                            }
                          >
                            <MenuItem value="small">Small</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="large">Large</MenuItem>
                          </Select>
                        </FormControl>
                      </>
                    ) : (
                      <Box sx={{ mt: 1 }}>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) =>
                            handleImageChange(index, e.target.files[0])
                          }
                        />
                        {item.url && (
                          <img
                            src={item.url}
                            alt={`Image ${index}`}
                            style={{ width: "100px", marginTop: "10px" }}
                          />
                        )}
                      </Box>
                    )}
                    <IconButton
                      color="secondary"
                      onClick={() => handleRemoveContentItem(index)}
                      sx={{ mt: 1 }}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleAddContentItem("paragraph")}
                      sx={{ mt: 1, ml: 1 }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editingBlog?.categoryId || ""}
                    onChange={(e) =>
                      setEditingBlog({
                        ...editingBlog,
                        categoryId: e.target.value,
                      })
                    }
                  >
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleMainImageChange(e.target.files[0])}
                  disabled={loading}
                />
                {editingBlog?.image && (
                  <img
                    src={editingBlog.image}
                    alt="Main Image"
                    style={{ width: "100px", marginTop: "10px" }}
                  />
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseEditBlog}
                color="primary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateBlog}
                color="primary"
                disabled={loading}
              >
                Update
              </Button>
            </DialogActions>
          </Dialog>
          {/* Add Blog Dialog */}
          <Dialog
            open={openAddBlog}
            onClose={handleCloseAddBlog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Add Blog</DialogTitle>
            <DialogContent>
              {loading && (
                <div className="custom-loading-overlay">
                  <CircularProgress />
                </div>
              )}
              <Box sx={{ mb: 2 }}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Title"
                  type="text"
                  fullWidth
                  value={newBlog.title}
                  onChange={(e) =>
                    setNewBlog({ ...newBlog, title: e.target.value })
                  }
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                {newBlog.content.map((item, index) => (
                  <Box
                    key={index}
                    className="custom-edit-section"
                    sx={{ mb: 2, p: 2, borderRadius: 4 }}
                  >
                    <FormControl fullWidth margin="dense">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={item.type}
                        onChange={(e) =>
                          handleContentChange(index, "type", e.target.value)
                        }
                      >
                        <MenuItem value="paragraph">Paragraph</MenuItem>
                        <MenuItem value="bullet">Bullet</MenuItem>
                        <MenuItem value="image">Image</MenuItem>
                      </Select>
                    </FormControl>
                    {item.type !== "image" ? (
                      <>
                        <TextField
                          margin="dense"
                          label="Text"
                          type="text"
                          fullWidth
                          value={item.text || ""}
                          onChange={(e) =>
                            handleContentChange(index, "text", e.target.value)
                          }
                          sx={{ mt: 1 }}
                        />
                        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
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
                            label="Bold"
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
                            label="Italic"
                          />
                        </Box>
                        <FormControl fullWidth margin="dense" sx={{ mt: 1 }}>
                          <InputLabel>Font Size</InputLabel>
                          <Select
                            value={item.fontSize || "medium"}
                            onChange={(e) =>
                              handleContentChange(
                                index,
                                "fontSize",
                                e.target.value
                              )
                            }
                          >
                            <MenuItem value="small">Small</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="large">Large</MenuItem>
                          </Select>
                        </FormControl>
                      </>
                    ) : (
                      <Box sx={{ mt: 1 }}>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) =>
                            handleImageChange(index, e.target.files[0])
                          }
                        />
                        {item.url && (
                          <img
                            src={item.url}
                            alt={`Image ${index}`}
                            style={{ width: "100px", marginTop: "10px" }}
                          />
                        )}
                      </Box>
                    )}
                    <IconButton
                      color="secondary"
                      onClick={() => handleRemoveContentItem(index)}
                      sx={{ mt: 1 }}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleAddContentItem("paragraph")}
                      sx={{ mt: 1, ml: 1 }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={newBlog.categoryId}
                    onChange={(e) =>
                      setNewBlog({ ...newBlog, categoryId: e.target.value })
                    }
                  >
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleMainImageChange(e.target.files[0])}
                  disabled={loading}
                />
                {newBlog.image && (
                  <img
                    src={newBlog.image}
                    alt="Main Image"
                    style={{ width: "100px", marginTop: "10px" }}
                  />
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseAddBlog}
                color="primary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBlog}
                color="primary"
                disabled={loading}
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>
          {/* Delete Blog Confirm Dialog */}
          <Dialog
            open={openDeleteBlogConfirm}
            onClose={handleCloseDeleteBlogConfirm}
          >
            <DialogTitle>Delete Blog</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this blog?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseDeleteBlogConfirm}
                color="primary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteBlog}
                color="secondary"
                disabled={loading}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      {tabValue === 1 && (
        <>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddCategory}
            disabled={loading}
          >
            Add Category
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      <Button
                        color="primary"
                        onClick={() => handleOpenEditCategory(category)}
                        startIcon={<EditIcon />}
                        disabled={loading}
                      />
                      <Button
                        color="secondary"
                        onClick={() =>
                          handleOpenDeleteCategoryConfirm(category)
                        }
                        startIcon={<DeleteIcon />}
                        disabled={loading}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Edit Category Dialog */}
          <Dialog open={openEditCategory} onClose={handleCloseEditCategory}>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Category Name"
                type="text"
                fullWidth
                value={editingCategory?.name || ""}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    name: e.target.value,
                  })
                }
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseEditCategory}
                color="primary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCategory}
                color="primary"
                disabled={loading}
              >
                Update
              </Button>
            </DialogActions>
          </Dialog>
          {/* Add Category Dialog */}
          <Dialog open={openAddCategory} onClose={handleCloseAddCategory}>
            <DialogTitle>Add Category</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Category Name"
                type="text"
                fullWidth
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseAddCategory}
                color="primary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                color="primary"
                disabled={loading}
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>
          {/* Delete Category Confirm Dialog */}
          <Dialog
            open={openDeleteCategoryConfirm}
            onClose={handleCloseDeleteCategoryConfirm}
          >
            <DialogTitle>Delete Category</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this category? This will also
                clear its association with blogs.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseDeleteCategoryConfirm}
                color="primary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCategory}
                color="secondary"
                disabled={loading}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default BlogListPage;
