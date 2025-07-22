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
      return "Không có nội dung";
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
                  text: blogResponse.data.content || "Không có nội dung",
                  url: "",
                  bold: false,
                  italic: false,
                  fontSize: "medium",
                },
              ],
        };
        setBlog(transformedBlog);

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
            "Không thể tải bài viết hoặc bài viết được xem nhiều. Vui lòng kiểm tra slug hoặc điểm cuối API."
        );
        setLoading(false);
      }
    };

    fetchData();

    // Tăng lượt xem sau 30 giây
    let viewIncremented = false; // Cờ để đảm bảo chỉ tăng view một lần
    const timer = setTimeout(async () => {
      if (!viewIncremented) {
        try {
          const token = localStorage.getItem("token");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          await axios.post(
            `http://localhost:9999/api/blogs/slug/${slug}/views`,
            {},
            { headers }
          );
          viewIncremented = true; // Đánh dấu đã tăng view
        } catch (err) {
          console.error("Error incrementing views:", err);
        }
      }
    }, 30000); // 30 giây

    // Dọn dẹp timer khi component unmount hoặc slug thay đổi
    return () => {
      clearTimeout(timer);
    };
  }, [slug]);

  if (loading) {
    return <div className="blogdetail-loading">Đang tải...</div>;
  }

  if (error) {
    return <div className="blogdetail-error">Lỗi: {error}</div>;
  }

  if (!blog) {
    return (
      <div className="blogdetail-error">
        Không tìm thấy bài viết hoặc tải thất bại. Vui lòng kiểm tra console để
        biết chi tiết.
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
                    {new Date(blog.createdAt).toLocaleDateString("vi-VN", {
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
                        alt={`Hình ảnh nội dung ${index}`}
                        className="content-image"
                      />
                    ) : (
                      <span
                        className={`${item.bold ? "bold-text" : ""} ${
                          item.italic ? "italic-text" : ""
                        } ${item.fontSize}-text`}
                      >
                        {item.text || "Không có nội dung"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="blogdetail-sidebar">
          <h3 className="blogdetail-sidebar-title">
            Bài viết được xem nhiều nhất
          </h3>
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
                    Chi tiết
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
