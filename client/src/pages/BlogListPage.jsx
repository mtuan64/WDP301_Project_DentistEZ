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
} from "@mui/material";
import "../assets/css/BlogListPage.css";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const BlogListPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [editingBlog, setEditingBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({
    title: "",
    content: "",
    image: "",
  });
  const [openEdit, setOpenEdit] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user || user.role !== "admin") {
      navigate("/");
      return;
    }

    console.log("User role:", user.role);
    console.log("Token:", token);

    fetchBlogs();
  }, [navigate]);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/blogs", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setBlogs(response.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      alert("Failed to fetch blogs: " + error.message);
    }
  };

  const handleUpdateBlog = async () => {
    try {
      let updatedBlog = { ...editingBlog };
      if (imageFile) {
        if (
          !["image/jpeg", "image/jpg", "image/png"].includes(imageFile.type)
        ) {
          alert("Please select a JPEG or PNG image.");
          return;
        }
        const formData = new FormData();
        formData.append("image", imageFile);
        console.log("Uploading image for update:");
        for (let pair of formData.entries()) {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
        const uploadResponse = await axios.post(
          "http://localhost:9999/api/blogs/upload",
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        updatedBlog.image = uploadResponse.data.url;
      }
      const response = await axios.put(
        `http://localhost:9999/api/blogs/${editingBlog._id}`,
        {
          title: updatedBlog.title,
          content: updatedBlog.content,
          image: updatedBlog.image,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setBlogs(
        blogs.map((blog) =>
          blog._id === editingBlog._id ? response.data : blog
        )
      );
      setEditingBlog(null);
      setOpenEdit(false);
      setImageFile(null);
    } catch (error) {
      console.error("Error updating blog:", error);
      alert("Failed to update blog: " + error.message);
    }
  };

  const handleDeleteBlog = async () => {
    try {
      await axios.delete(
        `http://localhost:9999/api/blogs/${blogToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setBlogs(blogs.filter((blog) => blog._id !== blogToDelete._id));
      setOpenDeleteConfirm(false);
      setBlogToDelete(null);
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog: " + error.message);
    }
  };

  const handleAddBlog = async () => {
    try {
      let blogToAdd = { ...newBlog };
      if (imageFile) {
        if (
          !["image/jpeg", "image/jpg", "image/png"].includes(imageFile.type)
        ) {
          alert("Please select a JPEG or PNG image.");
          return;
        }
        const formData = new FormData();
        formData.append("image", imageFile);
        console.log("Uploading image for add:");
        for (let pair of formData.entries()) {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
        const uploadResponse = await axios.post(
          "http://localhost:9999/api/blogs/upload",
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        blogToAdd.image = uploadResponse.data.url;
      } else {
        alert("Please select an image to upload.");
        return;
      }
      const response = await axios.post(
        "http://localhost:9999/api/blogs",
        {
          title: blogToAdd.title,
          content: blogToAdd.content,
          image: blogToAdd.image,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setBlogs([...blogs, response.data]);
      setNewBlog({ title: "", content: "", image: "" });
      setImageFile(null);
      setOpenAdd(false);
    } catch (error) {
      console.error("Error adding blog:", error);
      alert("Failed to add blog: " + error.message);
    }
  };

  const handleOpenEdit = (blog) => {
    setEditingBlog({
      _id: blog._id,
      title: blog.title,
      content: blog.content,
      image: blog.image,
    });
    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditingBlog(null);
    setImageFile(null);
  };

  const handleOpenAdd = () => {
    setOpenAdd(true);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
    setNewBlog({ title: "", content: "", image: "" });
    setImageFile(null);
  };

  const handleOpenDeleteConfirm = (blog) => {
    setBlogToDelete(blog);
    setOpenDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
    setBlogToDelete(null);
  };

  return (
    <div className="blog-list-page">
      <h1>Blog List</h1>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleOpenAdd}
      >
        Add Blog
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blogs.map((blog) => (
              <TableRow key={blog._id}>
                <TableCell>{blog.title}</TableCell>
                <TableCell>{blog.content}</TableCell>
                <TableCell>
                  {blog.image && (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      style={{ width: "50px" }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    color="primary"
                    onClick={() => handleOpenEdit(blog)}
                    startIcon={<EditIcon />}
                  />
                  <Button
                    color="secondary"
                    onClick={() => handleOpenDeleteConfirm(blog)}
                    startIcon={<DeleteIcon />}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={handleCloseEdit}>
        <DialogTitle>Edit Blog</DialogTitle>
        <DialogContent>
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
          <TextField
            margin="dense"
            label="Content"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={editingBlog?.content || ""}
            onChange={(e) =>
              setEditingBlog({ ...editingBlog, content: e.target.value })
            }
          />
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => {
              const file = e.target.files[0];
              console.log("Selected file for edit:", file);
              setImageFile(file);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} color="primary">
            Cancel
          </Button>
          <Button onClick={handleUpdateBlog} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={handleCloseAdd}>
        <DialogTitle>Add Blog</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            type="text"
            fullWidth
            value={newBlog.title}
            onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Content"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={newBlog.content}
            onChange={(e) =>
              setNewBlog({ ...newBlog, content: e.target.value })
            }
          />
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => {
              const file = e.target.files[0];
              console.log("Selected file for add:", file);
              setImageFile(file);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddBlog} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDeleteConfirm} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Delete Blog</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this blog?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteBlog} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BlogListPage;
