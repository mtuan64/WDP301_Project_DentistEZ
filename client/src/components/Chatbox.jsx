import React, { useState, useEffect, useRef } from "react";
import "../assets/css/Chat/Chatbox.css";
import axios from "axios";
import { useAuth } from "../context/authContext";
import io from "socket.io-client";
import { MdMessage } from "react-icons/md";
const socket = io("http://localhost:9999");

const Chatbox = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messageMap, setMessageMap] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatNotifications, setChatNotifications] = useState({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [selectedChat]);

  const messages = React.useMemo(() => {
    if (!selectedChat) return [];
    const roomId = selectedChat.roomId;
    return roomId && messageMap[roomId] ? messageMap[roomId] : [];
  }, [selectedChat?.roomId, messageMap]);

  const [patients, setPatients] = useState([]);

  const chatOptions = [
    {
      id: "1",
      type: "ai",
      name: "AI Assistant",
      avatar: "🤖",
      lastMessage: "How can I help you?",
      timestamp: "08:06 PM",
      roomId: `ai-session-${user?.id}`,
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
      timestamp: "",
      roomId: `chat-${user.id}`,
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
        roomId: `chat-${patient._id}`,
      });
    });
  }

  useEffect(() => {
    if (!user) return;
    const loadAllMessages = async () => {
      const allMessages = {};
      const allNotifications = {};
      for (const chat of chatOptions) {
        let newMessages = [];
        if (chat.type === "ai") {
          const savedMessages = localStorage.getItem(
            `chatMessages_${chat.roomId}`
          );
          newMessages = savedMessages ? JSON.parse(savedMessages) : [];
        } else {
          try {
            const userId = user.role === "patient" ? user.id : chat.id;
            const response = await axios.get(
              `http://localhost:9999/api/chat/messages?userId=${userId}`
            );
            newMessages = response.data.map((msg) => ({
              text: msg.message,
              sender:
                msg.senderId._id.toString() === user.id.toString()
                  ? "user"
                  : msg.senderId.fullname,
              timestamp: new Date(msg.timestamp).toLocaleTimeString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
              timestampRaw: msg.timestamp,
            }));
          } catch (error) {
            console.error("Error fetching messages:", error);
            newMessages = [];
          }
        }
        allMessages[chat.roomId] = newMessages;
        const lastRead = lastReadTimestamps[chat.roomId] || 0;
        const unreadCount = newMessages.filter(
          (msg) =>
            msg.sender !== "user" &&
            new Date(msg.timestampRaw).getTime() > lastRead
        ).length;
        allNotifications[chat.roomId] = unreadCount;
      }
      setMessageMap(allMessages);
      setChatNotifications(allNotifications);
    };
    loadAllMessages();
  }, [user]);

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
      const roomId = data.roomId;
      const newMessage = {
        text: data.message,
        sender:
          data.senderId === user.id?.toString() ? "user" : data.senderName,
        timestamp: new Date(data.timestamp).toLocaleTimeString("en-US", {
          timeZone: "Asia/Ho_Chi_Minh",
        }),
      };
      setMessageMap((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), newMessage],
      }));
      if (!selectedChat || selectedChat.roomId !== roomId) {
        setChatNotifications((prev) => ({
          ...prev,
          [roomId]: (prev[roomId] || 0) + 1,
        }));
      }
    };

    socket.on("updatePatients", handleUpdatePatients);
    socket.on("receiveMessage", handleReceiveMessage);
    return () => {
      socket.off("updatePatients", handleUpdatePatients);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [user, selectedChat]);

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
    });
    const userMessage = {
      text: inputMessage,
      sender: "user",
      timestamp,
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
          timestamp: new Date().toLocaleTimeString("en-US", {
            timeZone: "Asia/Ho_Chi_Minh",
          }),
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
          timestamp: new Date().toLocaleTimeString("en-US", {
            timeZone: "Asia/Ho_Chi_Minh",
          }),
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

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="chat-container">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="chat-toggle">
          <span className="chat-icon">💬</span>
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
                  onClick={() => {
                    setSelectedChat(chat);
                    setChatNotifications((prev) => ({
                      ...prev,
                      [chat.roomId]: 0,
                    }));
                    setLastReadTimestamps((prev) => ({
                      ...prev,
                      [chat.roomId]: Date.now(),
                    }));
                  }}
                >
                  <span className="user-avatar">{chat.avatar}</span>
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
