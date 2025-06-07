import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../assets/css/Blog/BlogPage.css";

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [blogsPerPage] = useState(9);
  const [currentLatestIndex, setCurrentLatestIndex] = useState(0);

  const carouselIntervalRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const blogsResponse = await axios.get(
          "http://localhost:9999/api/blogs",
          { headers }
        );
        // Transform content if it's a string or missing
        const transformedBlogs = blogsResponse.data.map((blog) => ({
          ...blog,
          content: Array.isArray(blog.content)
            ? blog.content
            : [
                {
                  type: "paragraph",
                  text: blog.content || "No content available",
                },
              ],
        }));
        const sortedBlogs = transformedBlogs.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setBlogs(sortedBlogs);

        const categoriesResponse = await axios.get(
          "http://localhost:9999/api/categories",
          { headers }
        );
        setCategories(categoriesResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
        alert("Failed to load blogs or categories. Please try again later.");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (currentPage !== 1) return;

    const startCarousel = () => {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentLatestIndex((prevIndex) => {
          const latestBlogsLength = Math.min(blogs.length, 3);
          return (prevIndex + 1) % latestBlogsLength;
        });
      }, 5000);
    };

    const stopCarousel = () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };

    startCarousel();

    return () => stopCarousel();
  }, [currentPage, blogs]);

  if (loading) {
    return (
      <div className="blogpage-loading">
        <div className="blogpage-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const latestBlogs = blogs.slice(0, 3);
  const filteredListBlogs = selectedCategory
    ? blogs.filter((blog) => {
        const categoryId = blog.categoryId?._id || blog.categoryId;
        return categoryId && categoryId === selectedCategory;
      })
    : blogs;

  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentListBlogs = filteredListBlogs.slice(
    indexOfFirstBlog,
    indexOfLastBlog
  );
  const totalPages = Math.ceil(filteredListBlogs.length / blogsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength - 3) + "...";
  };

  const getContentSummary = (content) => {
    if (!Array.isArray(content) || content.length === 0)
      return "No content available";
    // Take the first paragraph or bullet text and truncate if necessary
    const firstItem = content[0];
    return truncateText(firstItem.text, 50); // Reduced to 50 for better fit in 100px height
  };

  const getCategoryColor = (categoryName) => {
    const colors = {
      Productivity: "#ffcccc",
      Development: "#e6ccff",
      "UI/UX": "#cce0ff",
      Tutorials: "#ccffcc",
    };
    return colors[categoryName] || "#e0e0e0";
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(
      (cat) => cat._id === (categoryId._id || categoryId)
    );
    return category?.name || "Uncategorized";
  };

  return (
    <div className="blogpage-page">
      <div className="blogpage-layout">
        <aside className="blogpage-sidebar">
          <h3 className="blogpage-sidebar-title">Other featured posts</h3>
          <div className="blogpage-featured-posts">
            {blogs.slice(3, 7).map((blog) => (
              <div key={blog._id} className="blogpage-featured-post-card">
                <Link to={`/blog/${blog.slug}`}>
                  <img
                    src={blog.image || "https://via.placeholder.com/100x100"}
                    alt={blog.title}
                    className="blogpage-featured-post-image"
                    onError={(e) =>
                      (e.target.src = "https://via.placeholder.com/100x100")
                    }
                  />
                </Link>
                <div className="blogpage-featured-post-content">
                  <Link
                    to={`/blog/${blog.slug}`}
                    className="blogpage-featured-post-title-link"
                  >
                    <h4 className="blogpage-featured-post-title">
                      {truncateText(blog.title, 20)} {/* Reduced to 20 for better fit */}
                    </h4>
                  </Link>
                  <p className="blogpage-featured-post-excerpt">
                    {getContentSummary(blog.content)}
                  </p>
                  <Link to={`/blog/${blog.slug}`} className="blogpage-read-more">
                    Read article
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="blogpage-content-main">
          {currentPage === 1 && latestBlogs.length > 0 && (
            <section className="blogpage-latest-blog">
              <h2 className="blogpage-section-title">Read our latest blog</h2>
              <div className="blogpage-latest-blog-carousel">
                <div
                  className="blogpage-latest-blog-wrapper"
                  style={{
                    transform: `translateX(-${currentLatestIndex * 100}%)`,
                  }}
                >
                  {latestBlogs.map((blog) => (
                    <div key={blog._id} className="blogpage-latest-blog-card">
                      <div className="blogpage-blog-image">
                        <Link to={`/blog/${blog.slug}`}>
                          <img
                            src={
                              blog.image ||
                              "https://via.placeholder.com/1200x400"
                            }
                            alt={blog.title}
                            className="blogpage-latest-blog-image"
                            onError={(e) =>
                              (e.target.src =
                                "https://via.placeholder.com/1200x400")
                            }
                          />
                        </Link>
                      </div>
                      <div className="blogpage-blog-content">
                        <span className="blogpage-blog-category">
                          {getCategoryName(blog.categoryId)}
                        </span>
                        <Link
                          to={`/blog/${blog.slug}`}
                          className="blogpage-blog-title-link"
                        >
                          <h3 className="blogpage-blog-title">
                            {truncateText(blog.title, 60)}
                          </h3>
                        </Link>
                        <p className="blogpage-blog-excerpt">
                          {getContentSummary(blog.content)}
                        </p>
                        <Link to={`/blog/${blog.slug}`} className="blogpage-read-more">
                          Read article
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="blogpage-list-blogs">
            <h2 className="blogpage-section-title">Recent Posts</h2>
            <div className="blogpage-category-filter">
              <button
                className={`blogpage-category-btn ${
                  selectedCategory === null ? "active" : ""
                }`}
                onClick={() => handleCategorySelect(null)}
              >
                All Posts
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  className={`blogpage-category-btn ${
                    selectedCategory === category._id ? "active" : ""
                  }`}
                  style={{ backgroundColor: getCategoryColor(category.name) }}
                  onClick={() => handleCategorySelect(category._id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="blogpage-list-grid">
              {currentListBlogs.map((blog) => (
                <div key={blog._id} className="blogpage-list-blog-card">
                  <div className="blogpage-blog-image">
                    <Link to={`/blog/${blog.slug}`}>
                      <img
                        src={
                          blog.image || "https://via.placeholder.com/260x160"
                        }
                        alt={blog.title}
                        className="blogpage-list-blog-image"
                        onError={(e) =>
                          (e.target.src = "https://via.placeholder.com/260x160")
                        }
                      />
                    </Link>
                  </div>
                  <div className="blogpage-blog-content">
                    <Link to={`/blog/${blog.slug}`} className="blogpage-blog-title-link">
                      <h3 className="blogpage-blog-title">
                        {truncateText(blog.title, 50)}
                      </h3>
                    </Link>
                    <p className="blogpage-blog-excerpt">
                      {getContentSummary(blog.content)}
                    </p>
                    <Link to={`/blog/${blog.slug}`} className="blogpage-read-more">
                      Read article
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="blogpage-pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="blogpage-pagination-btn"
                >
                  
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`blogpage-pagination-btn ${
                        currentPage === number ? "active" : ""
                      }`}
                    >
                      {number}
                    </button>
                  )
                )}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="blogpage-pagination-btn"
                >
                  
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;