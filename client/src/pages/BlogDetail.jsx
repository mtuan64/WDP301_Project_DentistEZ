import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../assets/css/Blog/BlogDetail.css";

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(
          `http://localhost:9999/api/blogs/slug/${slug}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );
        // Transform content if it's a string or missing
        const transformedBlog = {
          ...response.data,
          content: Array.isArray(response.data.content)
            ? response.data.content
            : [
                {
                  type: "paragraph",
                  text: response.data.content || "No content available",
                  bold: false,
                },
              ],
        };
        setBlog(transformedBlog);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching blog:", err);
        console.log("Response:", err.response?.data);
        console.log("Status:", err.response?.status);
        setError(
          err.response?.data?.message ||
            "Failed to fetch blog post. Please check the slug or API endpoint."
        );
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  if (loading) {
    return <div className="blogdetail-loading">Loading...</div>;
  }

  if (error) {
    return <div className="blogdetail-error">Error: {error}</div>;
  }

  if (!blog) {
    return <div className="blogdetail-error">Blog not found</div>;
  }

  return (
    <div className="blogdetail-page">
      <div className="blogdetail-container">
        <div className="blogdetail-card">
          <h1 className="blogdetail-title">{blog.title}</h1>
          <span className="blogdetail-date">
            {new Date(blog.createdAt).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          {blog.image && (
            <div className="blogdetail-image">
              <img src={blog.image} alt={blog.title} />
            </div>
          )}
          <div className="blogdetail-content">
            {blog.content.map((item, index) => (
              <div key={index} className={`content-${item.type}`}>
                {item.type === "bullet" && (
                  <span className="bullet-point">•</span>
                )}
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={`Content image ${index}`}
                    className="content-image"
                  />
                ) : (
                  <span className={item.bold ? "bold-text" : ""}>
                    {item.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
