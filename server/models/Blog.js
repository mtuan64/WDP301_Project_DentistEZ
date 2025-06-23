const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: [
    {
      type: {
        type: String,
        enum: ["paragraph", "bullet", "header", "image"],
        required: true,
      },
      text: {
        type: String,
        required: function () {
          return this.type !== "image";
        },
      },
      bold: {
        type: Boolean,
        default: false,
      },
      italic: {
        type: Boolean,
        default: false,
      },
      fontSize: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },
      url: {
        type: String,
        required: function () {
          return this.type === "image";
        },
      },
    },
  ],
  author_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "CategoryBlog",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  views: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
    required: true,
  },
});

blogSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

blogSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
