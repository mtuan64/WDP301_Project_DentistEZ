import React, { useState, useEffect, useRef } from "react";
import "../assets/css/Chat/Chatbox.css";
import axios from "axios";
import { useAuth } from "../context/authContext";
import io from "socket.io-client";

const socket = io("http://localhost:9999");

const Chatbox = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [patients, setPatients] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log("User from useAuth:", user);
  }, [user]);

  const chatOptions = [
    {
      id: "1",
      type: "ai",
      name: "AI Assistant",
      avatar: "🤖",
      lastMessage: "How can I help you?",
      timestamp: "08:06 PM",
    },
  ];

  if (user?.role === "patient") {
    chatOptions.push({
      id: "2",
      type: "user",
      name: "Support Team",
      avatar: "👥",
      role: "staff",
      lastMessage: "We are here to help!",
      timestamp: "11:00 AM",
    });
  } else if (user?.role === "staff") {
    patients.forEach((patient) => {
      chatOptions.push({
        id: patient._id.toString(),
        type: "user",
        name: patient.fullname,
        avatar: "👤",
        role: "patient",
        lastMessage: "",
        timestamp: "",
      });
    });
  }

  useEffect(() => {
    if (!user || !selectedChat) return;

    // 🔒 Chỉ đọc localStorage nếu là AI
    if (selectedChat.type !== "ai") return;

    const roomId = `unique-session-${user.id}`;
    const savedMessages = localStorage.getItem(`chatMessages_${roomId}`);

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [user, selectedChat]);
  

  useEffect(() => {
    if (!user || !selectedChat || messages.length === 0) return;

    if (selectedChat.type !== "ai") return;

    const roomId = `unique-session-${user.id}`;
    localStorage.setItem(`chatMessages_${roomId}`, JSON.stringify(messages));
  }, [messages, user, selectedChat]);
  

  useEffect(() => {
    if (!user) return;

    socket.emit("joinRoom", {
      userId: user.id?.toString() || "unknown",
      role: user.role,
    });

    socket.on("updatePatients", (patientList) => {
      setPatients(patientList);
      console.log("Updated patients:", patientList);
    });

    socket.on("receiveMessage", (data) => {
      const roomId = data.roomId;
      if (
        (user.role === "staff" &&
          roomId.startsWith("chat-") &&
          selectedChat?.role === "patient" &&
          roomId === `chat-${selectedChat.id}`) ||
        (user.role === "patient" && roomId === `chat-${user.id}`)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            text: data.message,
            sender:
              data.senderId === user.id?.toString() ? "user" : data.senderName,
            timestamp: new Date(data.timestamp).toLocaleTimeString("en-US", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
          },
        ]);
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("updatePatients");
    };
  }, [user, selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat || !user) {
      console.error("Cannot send message:", {
        inputMessage,
        selectedChat,
        user,
      });
      return;
    }

    const userMessage = {
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    if (selectedChat.type === "ai") {
      try {
        const response = await axios.post(
          "http://localhost:9999/api/chat/chatwithai",
          { message: inputMessage, sessionId: Date.now() },
          { headers: { "Content-Type": "application/json" } }
        );

        let formattedReply = response.data.reply.replace(/\*\*/g, "<br>");
        formattedReply = formattedReply.replace(/\*/g, "");

        const aiMessage = {
          text: formattedReply,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString("en-US", {
            timeZone: "Asia/Ho_Chi_Minh",
          }),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error(
          "Error sending to AI:",
          error.response?.data || error.message
        );
        const errorMessage = {
          text: "Sorry, something went wrong.",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString("en-US", {
            timeZone: "Asia/Ho_Chi_Minh",
          }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } else if (
      selectedChat.role === "staff" ||
      selectedChat.role === "patient"
    ) {
      let receiverId = selectedChat.role === "patient" ? selectedChat.id : null;

      socket.emit("sendMessage", {
        senderId: user.id?.toString() || "unknown",
        senderName: user.fullname,
        role: user.role,
        message: inputMessage,
        receiverId,
      });
    }
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="chat-container">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="chat-toggle">
          <span className="chat-icon">💬</span>
        </button>
      )}
      {isOpen && (
        <div className="chat-box">
          <button className="close-button" onClick={() => setIsOpen(false)}>
            ✖
          </button>
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>Chats</h3>
              <span className="online-status">Available contacts</span>
            </div>
            <div className="user-list">
              {chatOptions.map((chat) => (
                <div
                  key={chat.id}
                  className={`user-item ${
                    selectedChat?.id === chat.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <span className="user-avatar">{chat.avatar}</span>
                  <div className="user-info">
                    <div className="user-name">{chat.name}</div>
                    <div className="user-last-message">{chat.lastMessage}</div>
                  </div>
                  <div className="user-timestamp">{chat.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="chat-area">
            {selectedChat ? (
              <>
                <div className="chat-header">
                  <span className="chat-title">{selectedChat.name}</span>
                </div>
                <div className="messages-area">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message-container ${
                        msg.sender === "user" ? "user" : "other"
                      }`}
                    >
                      <div
                        className={`message ${
                          msg.sender === "user" ? "user" : "other"
                        }`}
                      >
                        <p
                          className="message-text"
                          dangerouslySetInnerHTML={{ __html: msg.text }}
                        ></p>
                        {msg.sender === "user" && (
                          <span className="message-status">✓✓</span>
                        )}
                      </div>
                      <span
                        className={`message-timestamp ${
                          msg.sender === "user" ? "user" : "other"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="input-area">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="message-input"
                    placeholder="Type your message..."
                  />
                  <button onClick={handleSendMessage} className="send-button">
                    ➤
                  </button>
                </div>
              </>
            ) : (
              <div className="no-user-selected">
                <span className="chat-icon">💬</span>
                <h3>Select a chat to start</h3>
                <p>Choose a contact from the list to begin messaging.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbox;
