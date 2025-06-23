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
  Box,
  IconButton,
  CircularProgress,
  Pagination,
  Typography,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "../assets/css/Blog/CategoryBlog.css";
import { useNavigate } from "react-router-dom";

const CategoryBlog = () => {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    status: "active",
  });
  const [openEditCategory, setOpenEditCategory] = useState(false);
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [openDeleteCategoryDialog, setOpenDeleteCategoryDialog] =
    useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteCategoryType, setDeleteCategoryType] = useState("soft");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;
  const navigate = useNavigate();

  const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user && user.role === "admin";
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:9999/api/admin/categories",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: {
            page: currentPage,
            limit: pageSize,
            status: filterStatus,
            search: searchQuery,
          },
        }
      );
      setCategories(response.data.categories);
      setTotalCategories(response.data.totalCategories);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to fetch categories: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, searchQuery]); // Các phụ thuộc của fetchCategories

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Admin access required to view categories.",
        severity: "error",
      });
      return;
    }
    fetchCategories();
  }, [fetchCategories]);

  // Validate category data
  const validateCategory = (category) => {
    if (!category.name.trim()) {
      setNotification({
        open: true,
        message: "Please enter a category name.",
        severity: "error",
      });
      return false;
    }
    if (!["active", "inactive"].includes(category.status)) {
      setNotification({
        open: true,
        message: "Invalid status selected.",
        severity: "error",
      });
      return false;
    }
    return true;
  };

  // Handle add category
  const handleAddCategory = async () => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Admin access required to add categories.",
        severity: "error",
      });
      return;
    }
    setLoading(true);
    try {
      if (!validateCategory(newCategory)) {
        setLoading(false);
        return;
      }
      console.log("Adding category with data:", newCategory);
      const response = await axios.post(
        "http://localhost:9999/api/categories",
        { name: newCategory.name, status: newCategory.status },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      console.log("Add category response:", response.data);
      if (currentPage === 1) {
        setCategories([response.data, ...categories].slice(0, pageSize));
        setTotalCategories(totalCategories + 1);
        setTotalPages(Math.ceil((totalCategories + 1) / pageSize));
      }
      setNewCategory({ name: "", status: "active" });
      setOpenAddCategory(false);
      setNotification({
        open: true,
        message: "Category added successfully!",
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to add category: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle update category
  const handleUpdateCategory = async () => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Admin access required to update categories.",
        severity: "error",
      });
      return;
    }
    setLoading(true);
    try {
      if (!validateCategory(editingCategory)) {
        setLoading(false);
        return;
      }
      console.log("Updating category with data:", editingCategory);
      const response = await axios.put(
        `http://localhost:9999/api/categories/${editingCategory._id}`,
        { name: editingCategory.name, status: editingCategory.status },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      console.log("Update category response:", response.data);
      setCategories(
        categories.map((category) =>
          category._id === editingCategory._id ? response.data : category
        )
      );
      setEditingCategory(null);
      setOpenEditCategory(false);
      setNotification({
        open: true,
        message: "Category updated successfully!",
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to update category: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Admin access required to delete categories.",
        severity: "error",
      });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.delete(
        `http://localhost:9999/api/categories/${categoryToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: { permanent: deleteCategoryType === "permanent" },
        }
      );
      console.log("Delete category response:", response.data);
      if (deleteCategoryType === "soft") {
        setCategories(
          categories.map((cat) =>
            cat._id === categoryToDelete._id
              ? { ...cat, status: "inactive" }
              : cat
          )
        );
      } else {
        setCategories(
          categories.filter((cat) => cat._id !== categoryToDelete._id)
        );
        setTotalCategories(totalCategories - 1);
        setTotalPages(Math.ceil((totalCategories - 1) / pageSize));
        if (categories.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      }
      setOpenDeleteCategoryDialog(false);
      setCategoryToDelete(null);
      setNotification({
        open: true,
        message: response.data.message,
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to delete category: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle modal open/close
  const handleOpenEditCategory = (category) => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Admin access required to edit categories.",
        severity: "error",
      });
      return;
    }
    setEditingCategory({
      _id: category._id,
      name: category.name,
      status: category.status || "active",
    });
    setOpenEditCategory(true);
  };

  const handleCloseEditCategory = () => {
    setOpenEditCategory(false);
    setEditingCategory(null);
  };

  const handleOpenAddCategory = () => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Admin access required to add categories.",
        severity: "error",
      });
      return;
    }
    setOpenAddCategory(true);
  };

  const handleCloseAddCategory = () => {
    setOpenAddCategory(false);
    setNewCategory({ name: "", status: "active" });
  };

  const handleOpenDeleteCategoryDialog = (category) => {
    if (!isAdmin()) {
      setNotification({
        open: true,
        message: "Admin access required to delete categories.",
        severity: "error",
      });
      return;
    }
    setCategoryToDelete(category);
    setDeleteCategoryType(category.status === "active" ? "soft" : "permanent");
    setOpenDeleteCategoryDialog(true);
  };

  const handleCloseDeleteCategoryDialog = () => {
    setOpenDeleteCategoryDialog(false);
    setCategoryToDelete(null);
    setDeleteCategoryType("soft");
  };

  const handleCloseNotification = () => {
    setNotification({ open: false, message: "", severity: "success" });
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  return (
    <div className="category-blog-page">
      <h1>Category Management</h1>
      <Box className="filter-search-container">
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-status-label">Filter by Status</InputLabel>
          <Select
            labelId="filter-status-label"
            value={filterStatus}
            label="Filter by Status"
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            startAdornment={
              <InputAdornment position="start">
                <FilterAltIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="">
              <em>All Statuses</em>
            </MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Search by Name"
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
          Showing {categories.length} / {totalCategories} Categories
        </Typography>
        {isAdmin() && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAddCategory}
              disabled={loading}
            >
              Add Category
            </Button>
            <Button
              variant="contained"
              color="primary"
              className="navigation-button"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/admin/blogs")}
              disabled={loading}
            >
              Back to Blogs
            </Button>
          </Box>
        )}
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : categories.length === 0 ? (
        <Typography sx={{ textAlign: "center", my: 4 }}>
          No categories found.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="stt">STT</TableCell>
                <TableCell className="name">Name</TableCell>
                <TableCell className="status">Status</TableCell>
                {isAdmin() && (
                  <TableCell className="actions">Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category, index) => (
                <TableRow key={category._id}>
                  <TableCell className="stt">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="name">{category.name}</TableCell>
                  <TableCell
                    className={`status ${category.status.toLowerCase()}`}
                  >
                    {category.status}
                  </TableCell>
                  {isAdmin() && (
                    <TableCell className="actions">
                      <Button
                        color="primary"
                        onClick={() => handleOpenEditCategory(category)}
                        startIcon={<EditIcon />}
                        disabled={loading}
                      />
                      <Button
                        color="secondary"
                        onClick={() => handleOpenDeleteCategoryDialog(category)}
                        startIcon={<DeleteIcon />}
                        disabled={loading}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
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
        open={openAddCategory}
        onClose={handleCloseAddCategory}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 1300 }}
      >
        <DialogTitle
          sx={{
            padding: "10px 24px",
            minHeight: "60px",
            display: "flex",
            alignItems: "center",
            whiteSpace: "normal",
          }}
        >
          Add Category
        </DialogTitle>
        <DialogContent sx={{ padding: "20px 24px" }}>
          {" "}
          {/* Tăng padding-top để tạo khoảng cách */}
          <TextField
            autoFocus
            label="Category Name"
            variant="outlined"
            fullWidth
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            sx={{ mt: 2, mb: 1 }}
          />
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newCategory.status}
              label="Status"
              onChange={(e) => {
                console.log("New category status changed to:", e.target.value);
                setNewCategory({ ...newCategory, status: e.target.value });
              }}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ padding: "10px 24px", gap: 1 }}>
          <Button onClick={handleCloseAddCategory} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddCategory}
            disabled={loading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openEditCategory}
        onClose={handleCloseEditCategory}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 1300 }}
      >
        <DialogTitle
          sx={{
            padding: "10px 24px",
            minHeight: "60px",
            display: "flex",
            alignItems: "center",
            whiteSpace: "normal",
          }}
        >
          Edit Category
        </DialogTitle>
        <DialogContent sx={{ padding: "20px 24px" }}>
          {" "}
          {/* Tăng padding-top để tạo khoảng cách */}
          <TextField
            autoFocus
            label="Category Name"
            variant="outlined"
            fullWidth
            value={editingCategory?.name || ""}
            onChange={(e) =>
              setEditingCategory({ ...editingCategory, name: e.target.value })
            }
            sx={{ mt: 2, mb: 1 }}
          />
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={editingCategory?.status || "active"}
              label="Status"
              onChange={(e) => {
                console.log(
                  "Editing category status changed to:",
                  e.target.value
                );
                setEditingCategory({
                  ...editingCategory,
                  status: e.target.value,
                });
              }}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ padding: "10px 24px", gap: 1 }}>
          <Button onClick={handleCloseEditCategory} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateCategory}
            disabled={loading}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDeleteCategoryDialog}
        onClose={handleCloseDeleteCategoryDialog}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 1300 }}
      >
        <DialogTitle
          sx={{
            padding: "10px 24px",
            minHeight: "60px",
            display: "flex",
            alignItems: "center",
            whiteSpace: "normal",
          }}
        >
          Delete Category
        </DialogTitle>
        <DialogContent sx={{ padding: "20px 24px" }}>
          {" "}
          {/* Tăng padding-top để tạo khoảng cách */}
          <DialogContentText>
            {deleteCategoryType === "soft"
              ? "After deletion, the category's status will be set to inactive. All associated blogs will also be set to inactive."
              : "Are you sure you want to permanently delete this category?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: "10px 24px", gap: 1 }}>
          <Button onClick={handleCloseDeleteCategoryDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteCategory}
            disabled={loading}
          >
            Delete
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
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CategoryBlog;
