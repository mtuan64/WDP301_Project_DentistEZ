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

const BlogListPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [editingBlog, setEditingBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({
    title: "",
    content: "",
    author: "",
    image: "",
  });
  const [openEdit, setOpenEdit] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [blogToDelete, setBlogToDelete] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/blogs");
      setBlogs(response.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
  };

  const handleUpdateBlog = async () => {
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadResponse = await axios.post(
          "http://localhost:9999/api/blogs/upload",
          formData
        );
        editingBlog.image = uploadResponse.data.url;
      }
      const response = await axios.put(
        `http://localhost:9999/api/blogs/${editingBlog._id}`,
        editingBlog
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
    }
  };

  const handleDeleteBlog = async () => {
    try {
      await axios.delete(`http://localhost:9999/api/blogs/${blogToDelete._id}`);
      setBlogs(blogs.filter((blog) => blog._id !== blogToDelete._id));
      setOpenDeleteConfirm(false);
      setBlogToDelete(null);
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  };

  const handleAddBlog = async () => {
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadResponse = await axios.post(
          "http://localhost:9999/api/blogs/upload",
          formData
        );
        newBlog.image = uploadResponse.data.url;
      }
      const response = await axios.post(
        "http://localhost:9999/api/blogs",
        newBlog
      );
      setBlogs([...blogs, response.data]);
      setNewBlog({ title: "", content: "", author: "", image: "" });
      setImageFile(null);
      setOpenAdd(false);
    } catch (error) {
      console.error("Error adding blog:", error);
    }
  };

  const handleOpenEdit = (blog) => {
    setEditingBlog(blog);
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
    setNewBlog({ title: "", content: "", author: "", image: "" });
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
      <Button variant="contained" color="primary" onClick={handleOpenAdd}>
        Add Blog
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blogs.map((blog) => (
              <TableRow key={blog._id}>
                <TableCell>{blog.title}</TableCell>
                <TableCell>{blog.author}</TableCell>
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
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenEdit(blog)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleOpenDeleteConfirm(blog)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
            label="Author"
            type="text"
            fullWidth
            value={editingBlog?.author || ""}
            onChange={(e) =>
              setEditingBlog({ ...editingBlog, author: e.target.value })
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
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
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
            label="Author"
            type="text"
            fullWidth
            value={newBlog.author}
            onChange={(e) => setNewBlog({ ...newBlog, author: e.target.value })}
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
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
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
