import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null; // Trả về null nếu JSON.parse thất bại
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    console.log("User state updated:", user);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user]);

  const login = (userData, token) => {
    console.log("Login called with:", userData, token);
    setUser(userData);
    if (token) {
      localStorage.setItem("token", token);
    }
  };

  const logout = async () => {
    console.log("Logout called");
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios
          .post(
            "/api/logout",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .catch((error) => {
            console.warn("Logout API call failed:", error);
            // Tiếp tục logout ở client ngay cả khi API thất bại
          });
      }

      // Xóa các tin nhắn AI từ localStorage
      const aiMessagePrefix = `chatMessages_ai-session-${user?.id}`;
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(aiMessagePrefix)) {
          localStorage.removeItem(key);
        }
      });

      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);

      // Xóa các tin nhắn AI từ localStorage ngay cả khi có lỗi
      const aiMessagePrefix = `chatMessages_ai-session-${user?.id}`;
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(aiMessagePrefix)) {
          localStorage.removeItem(key);
        }
      });

      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
