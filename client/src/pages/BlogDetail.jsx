import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";
import "../assets/css/Blog/BlogDetail.css";

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [topViewedBlogs, setTopViewedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hàm trích xuất và giới hạn nội dung
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength - 3) + "...";
  };

  const getContentSummary = (content) => {
    if (!Array.isArray(content) || content.length === 0)
      return "No content available";
    const firstItem = content[0];
    return truncateText(firstItem.text, 50);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch blog detail
        const blogResponse = await axios.get(
          `http://localhost:9999/api/blogs/slug/${slug}`,
          { headers }
        );
        const transformedBlog = {
          ...blogResponse.data,
          content: Array.isArray(blogResponse.data.content)
            ? blogResponse.data.content.map((item) => ({
                ...item,
                text: item.text || "",
                url: item.url || "",
                bold: item.bold || false,
                italic: item.italic || false,
                fontSize: item.fontSize || "medium",
              }))
            : [
                {
                  type: "paragraph",
                  text: blogResponse.data.content || "No content available",
                  url: "",
                  bold: false,
                  italic: false,
                  fontSize: "medium",
                },
              ],
        };
        setBlog(transformedBlog);

        // Increment blog views
        await axios.post(
          `http://localhost:9999/api/blogs/slug/${slug}/views`,
          {},
          { headers }
        );

        // Fetch top viewed blogs
        const topViewedResponse = await axios.get(
          "http://localhost:9999/api/blogs/top-viewed",
          { headers }
        );
        setTopViewedBlogs(topViewedResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        console.log("Response:", err.response?.data);
        console.log("Status:", err.response?.status);
        setError(
          err.response?.data?.message ||
            "Failed to fetch blog or top viewed posts. Please check the slug or API endpoint."
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return <div className="blogdetail-loading">Loading...</div>;
  }

  if (error) {
    return <div className="blogdetail-error">Error: {error}</div>;
  }

  if (!blog) {
    return (
      <div className="blogdetail-error">
        Blog not found or loading failed. Check console for details.
      </div>
    );
  }

  return (
    <div className="blogdetail-page">
      <div className="blogdetail-wrapper">
        <div className="blogdetail-main">
          <div className="blogdetail-container">
            <div className="blogdetail-card">
              <div className="blogdetail-header">
                <h1 className="blogdetail-title">{blog.title}</h1>
                <div className="blogdetail-meta">
                  <span className="blogdetail-date">
                    <CalendarTodayIcon fontSize="small" />
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                  <span className="blogdetail-views">
                    <VisibilityIcon fontSize="small" />
                    {blog.views || 0}
                  </span>
                </div>
              </div>
              {/* {blog.image && (
                <div className="blogdetail-image">
                  <img src={blog.image} alt={blog.title} />
                </div>
              )} */}
              <div className="blogdetail-content">
                {blog.content.map((item, index) => (
                  <div key={index} className={`content-${item.type}`}>
                    {item.type === "bullet" && (
                      <span className="bullet-point">•</span>
                    )}
                    {item.type === "image" ? (
                      <img
                        src={item.url || ""}
                        alt={`Content image ${index}`}
                        className="content-image"
                      />
                    ) : (
                      <span
                        className={`${item.bold ? "bold-text" : ""} ${
                          item.italic ? "italic-text" : ""
                        } ${item.fontSize}-text`}
                      >
                        {item.text || "No text available"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="blogdetail-sidebar">
          <h3 className="blogdetail-sidebar-title">Other Featured Posts</h3>
          <div className="blogdetail-featured-posts">
            {topViewedBlogs.map((topBlog, index) => (
              <div key={index} className="blogdetail-featured-post-card">
                <Link to={`/blog/${topBlog.slug}`}>
                  <img
                    src={topBlog.image || "https://via.placeholder.com/100x100"}
                    alt={topBlog.title}
                    className="blogdetail-featured-post-image"
                    onError={(e) =>
                      (e.target.src = "https://via.placeholder.com/100x100")
                    }
                  />
                </Link>
                <div className="blogdetail-featured-post-content">
                  <Link
                    to={`/blog/${topBlog.slug}`}
                    className="blogdetail-featured-post-title-link"
                  >
                    <h4 className="blogdetail-featured-post-title">
                      {topBlog.title.length > 20
                        ? topBlog.title.substring(0, 20) + "..."
                        : topBlog.title}
                    </h4>
                  </Link>
                  <p className="blogdetail-featured-post-excerpt">
                    {getContentSummary(topBlog.content)}
                  </p>
                  <Link
                    to={`/blog/${topBlog.slug}`}
                    className="blogdetail-read-more"
                  >
                    Read article
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
