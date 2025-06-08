const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categoryBlogSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
});

const CategoryBlog = mongoose.model("CategoryBlog", categoryBlogSchema);
module.exports = CategoryBlog;
