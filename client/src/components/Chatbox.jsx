import React, { useState, useEffect, useRef } from "react";
import "../assets/css/Chat/Chatbox.css";
import axios from "axios";
import { useAuth } from "../context/authContext";
import io from "socket.io-client";
import { BsChatDots } from "react-icons/bs";

const socket = io("http://localhost:9999");

const Chatbox = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messageMap, setMessageMap] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatNotifications, setChatNotifications] = useState({});
  const [patients, setPatients] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [selectedChat]);

  const messages = React.useMemo(() => {
    if (!selectedChat) return [];
    const roomId = selectedChat.roomId;
    return roomId && messageMap[roomId] ? messageMap[roomId] : [];
  }, [selectedChat, messageMap]);

  const chatOptions = [
    {
      id: "1",
      type: "ai",
      name: "DentistAI",
      avatar: "🤖",
      lastMessage: "How can I help you?",
      timestamp: "",
      roomId: `ai-session-${user?.id}`,
    },
  ];

  if (user?.role === "patient") {
    chatOptions.push({
      id: "2",
      type: "user",
      name: "Đội ngũ tư vấn",
      avatar: "👥",
      role: "staff",
      lastMessage: "We are here to help!",
      timestamp: "",
      roomId: `chat-${user.id}`,
    });
  } else if (user?.role === "staff") {
    patients.forEach((patient) => {
      chatOptions.push({
        id: patient._id.toString(),
        type: "user",
        name: patient.fullname,
        avatar: patient.profilePicture || "👤",
        role: "patient",
        lastMessage: "",
        timestamp: "",
        roomId: `chat-${patient._id}`,
      });
    });
  }

  useEffect(() => {
    if (!user) return;

    const loadAllMessages = async () => {
      const newMessageMap = { ...messageMap };
      const newNotifications = { ...chatNotifications };

      for (const chat of chatOptions) {
        let newMessages = [];
        if (chat.type === "ai") {
          const savedMessages = localStorage.getItem(
            `chatMessages_${chat.roomId}`
          );
          newMessages = savedMessages
            ? JSON.parse(savedMessages).map((msg) => ({
                ...msg,
                isRead: true, // Tin nhắn AI luôn được coi là đã đọc
              }))
            : [];
        } else {
          try {
            const userId = user.role === "patient" ? user.id : chat.id;
            const response = await axios.get(
              `http://localhost:9999/api/chat/messages?userId=${userId}`,
              {
                headers: { "Content-Type": "application/json" },
              }
            );
            newMessages = response.data.map((msg) => ({
              text: msg.message,
              sender:
                msg.senderId._id.toString() === user.id.toString()
                  ? "user"
                  : msg.senderId.fullname,
              avatar:
                msg.senderId._id.toString() === user.id.toString()
                  ? user.profilePicture || "👤"
                  : msg.senderId.profilePicture || "👤",
              timestamp: new Date(msg.timestamp).toLocaleTimeString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
                hour: "2-digit",
                minute: "2-digit",
              }),
              timestampRaw: msg.timestamp,
              isRead: msg.isRead,
            }));
          } catch (error) {
            console.error(`Error fetching messages for ${chat.roomId}:`, error);
            newMessages = [];
          }
        }
        newMessageMap[chat.roomId] = newMessages;

        if (chat.type !== "ai") {
          const unreadCount = newMessages.filter(
            (msg) => msg.sender !== "user" && !msg.isRead
          ).length;
          newNotifications[chat.roomId] = unreadCount;
        } else {
          newNotifications[chat.roomId] = 0; // Chat AI không có thông báo
        }
      }

      setMessageMap(newMessageMap);
      setChatNotifications(newNotifications);
    };

    loadAllMessages();
  }, [user, patients]);

  useEffect(() => {
    if (
      !user ||
      !selectedChat ||
      selectedChat.type !== "ai" ||
      !selectedChat.roomId
    )
      return;
    const aiMessages = messageMap[selectedChat.roomId] || [];
    if (aiMessages.length === 0) return;
    localStorage.setItem(
      `chatMessages_${selectedChat.roomId}`,
      JSON.stringify(aiMessages)
    );
  }, [messageMap, user, selectedChat]);

  useEffect(() => {
    if (!user) return;

    socket.emit("joinRoom", {
      userId: user.id?.toString() || "unknown",
      role: user.role,
    });

    const handleUpdatePatients = (patientList) => {
      setPatients(patientList);
      console.log("Updated patients:", patientList);
    };

    const handleReceiveMessage = (data) => {
      const roomId = data.roomId.toString();
      const newMessage = {
        text: data.message,
        sender:
          data.senderId === user.id?.toString() ? "user" : data.senderName,
        avatar:
          data.senderId === user.id?.toString()
            ? user.profilePicture || "👤"
            : data.profilePicture || "👤",
        timestamp: new Date(data.timestamp).toLocaleTimeString("en-US", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestampRaw: data.timestamp,
        isRead: data.isRead,
      };
      setMessageMap((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), newMessage],
      }));
      if (!data.isRead && data.senderId !== user.id?.toString()) {
        setChatNotifications((prev) => ({
          ...prev,
          [roomId]: (prev[roomId] || 0) + 1,
        }));
      }
    };

    const handleMessagesRead = ({ roomId }) => {
      setMessageMap((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] || []).map((msg) => ({
          ...msg,
          isRead: true,
        })),
      }));
      setChatNotifications((prev) => ({
        ...prev,
        [roomId]: 0,
      }));
    };

    socket.on("updatePatients", handleUpdatePatients);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("updatePatients", handleUpdatePatients);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [user, selectedChat, patients]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat || !user) {
      console.error("Cannot send message:", {
        inputMessage,
        selectedChat,
        user,
      });
      return;
    }
    const timestamp = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
    });
    const timestampRaw = new Date().toISOString();
    const userMessage = {
      text: inputMessage,
      sender: "user",
      avatar: user.profilePicture || "👤",
      timestamp,
      timestampRaw,
      isRead: true, // Tin nhắn do người dùng gửi luôn được coi là đã đọc
    };
    setMessageMap((prev) => ({
      ...prev,
      [selectedChat.roomId]: [
        ...(prev[selectedChat.roomId] || []),
        userMessage,
      ],
    }));
    setInputMessage("");

    if (selectedChat.type === "ai") {
      try {
        const response = await axios.post(
          "http://localhost:9999/api/chat/chatwithai",
          {
            message: inputMessage,
            sessionId: selectedChat.roomId,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        let formattedReply = response.data.reply.replace(/\*\*/g, "<br>");
        formattedReply = formattedReply.replace(/\*/g, "");
        const aiMessage = {
          text: formattedReply,
          sender: "ai",
          avatar: "🤖",
          timestamp: new Date().toLocaleTimeString("en-US", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestampRaw: new Date().toISOString(),
          isRead: true, // Tin nhắn AI trả về khi đang trong chat được coi là đã đọc
        };
        setMessageMap((prev) => ({
          ...prev,
          [selectedChat.roomId]: [
            ...(prev[selectedChat.roomId] || []),
            aiMessage,
          ],
        }));
      } catch (error) {
        console.error(
          "Error sending to AI:",
          error.response?.data || error.message
        );
        const errorMessage = {
          text: "Sorry, something went wrong.",
          sender: "ai",
          avatar: "🤖",
          timestamp: new Date().toLocaleTimeString("en-US", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestampRaw: new Date().toISOString(),
          isRead: true,
        };
        setMessageMap((prev) => ({
          ...prev,
          [selectedChat.roomId]: [
            ...(prev[selectedChat.roomId] || []),
            errorMessage,
          ],
        }));
      }
    } else {
      const roomId =
        user.role === "patient" ? `chat-${user.id}` : `chat-${selectedChat.id}`;
      const receiverId =
        selectedChat.role === "patient" ? selectedChat.id : null;
      socket.emit("sendMessage", {
        senderId: user.id?.toString() || "unknown",
        senderName: user.fullname,
        role: user.role,
        message: inputMessage,
        receiverId,
        roomId,
      });
    }
  };

  const groupMessages = (messages) => {
    const grouped = [];
    let currentGroup = [];

    messages.forEach((msg, index) => {
      if (index === 0 || msg.sender !== messages[index - 1].sender) {
        if (currentGroup.length > 0) {
          grouped.push(currentGroup);
        }
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      grouped.push(currentGroup);
    }

    return grouped;
  };

  const groupedMessages = groupMessages(messages);

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="chat-container">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="chat-toggle">
          <BsChatDots className="chat-icon" />
          {Object.values(chatNotifications).reduce((a, b) => a + b, 0) > 0 && (
            <span className="notification-badge toggle-badge">
              {Object.values(chatNotifications).reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
      )}
      {isOpen && (
        <div className="chat-box">
          <button className="close-button" onClick={() => setIsOpen(false)}>
            ×
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
                  onClick={() => {
                    setSelectedChat(chat);
                    if (chat.type !== "ai") {
                      socket.emit("markMessagesAsRead", {
                        roomId: chat.roomId,
                        userId: user.id,
                        role: user.role,
                      });
                      setMessageMap((prev) => ({
                        ...prev,
                        [chat.roomId]: (prev[chat.roomId] || []).map((msg) => ({
                          ...msg,
                          isRead: true,
                        })),
                      }));
                      setChatNotifications((prev) => ({
                        ...prev,
                        [chat.roomId]: 0,
                      }));
                    }
                  }}
                >
                  {chat.avatar.startsWith("http") ? (
                    <img
                      src={chat.avatar}
                      alt="avatar"
                      className="user-avatar"
                      onError={(e) =>
                        (e.target.src = "https://via.placeholder.com/30")
                      }
                    />
                  ) : (
                    <span className="user-avatar">{chat.avatar}</span>
                  )}
                  <div className="user-info">
                    <div className="user-name">{chat.name}</div>
                    <div className="user-last-message">
                      {messageMap[chat.roomId]?.[
                        messageMap[chat.roomId].length - 1
                      ]?.text || chat.lastMessage}
                    </div>
                  </div>
                  <div className="chat-right">
                    <div className="user-timestamp">
                      {messageMap[chat.roomId]?.[
                        messageMap[chat.roomId].length - 1
                      ]?.timestamp || chat.timestamp}
                    </div>
                    {chatNotifications[chat.roomId] > 0 && (
                      <span className="notification-badge">
                        {chatNotifications[chat.roomId]}
                      </span>
                    )}
                  </div>
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
                  {groupedMessages.map((group, groupIndex) => (
                    <div key={groupIndex} className="message-group">
                      {group.map((msg, index) => (
                        <div
                          key={index}
                          className={`message-container ${
                            msg.sender === "user" ? "user" : "other"
                          }`}
                        >
                          {index === 0 && (
                            <div className="message-sender-info">
                              {msg.sender !== "user" && (
                                <>
                                  {msg.avatar.startsWith("http") ? (
                                    <img
                                      src={msg.avatar}
                                      alt="avatar"
                                      className="message-avatar"
                                      onError={(e) =>
                                        (e.target.src =
                                          "https://via.placeholder.com/30")
                                      }
                                    />
                                  ) : (
                                    <span className="message-avatar">
                                      {msg.avatar}
                                    </span>
                                  )}
                                  <span className="message-sender-name">
                                    {msg.sender}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
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
                          {index === group.length - 1 && (
                            <span
                              className={`message-timestamp ${
                                msg.sender === "user" ? "user" : "other"
                              }`}
                            >
                              {msg.timestamp}
                            </span>
                          )}
                        </div>
                      ))}
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
                    placeholder="Nhập tin nhắn của bạn..."
                  />
                  <button onClick={handleSendMessage} className="send-button">
                    ➤
                  </button>
                </div>
              </>
            ) : (
              <div className="no-user-selected">
                <span className="chat-icon">💬</span>
                <h3>Chọn một cuộc trò chuyện để bắt đầu</h3>
                <p>Chọn một liên hệ từ danh sách để bắt đầu nhắn tin.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbox;
