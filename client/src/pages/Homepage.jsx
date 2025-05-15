import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center p-4 bg-blue-500 text-white">
      <h1 className="text-2xl font-bold">DentistEZ Clinic</h1>
      <button
        onClick={() => navigate("/login")}
        className="bg-white text-blue-500 px-4 py-2 rounded-md hover:bg-gray-200"
      >
        Đăng Nhập
      </button>
    </div>
  );
};

export default HomePage;
