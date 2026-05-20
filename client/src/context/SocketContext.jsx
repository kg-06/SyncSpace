import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [socketUserId, setSocketUserId] = useState(null);

  // Monitor localStorage token to update socketUserId reactively
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const decodedId = decoded.id || decoded._id;
          if (decodedId && decodedId !== socketUserId) {
            setSocketUserId(decodedId);
          }
        } catch (e) {
          if (socketUserId !== null) setSocketUserId(null);
        }
      } else {
        if (socketUserId !== null) setSocketUserId(null);
      }
    };

    checkToken(); // check immediately
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [socketUserId]);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // Register or re-register socket when userId changes or socket changes
  useEffect(() => {
    if (socket && socketUserId) {
      socket.emit("register", socketUserId);
    }
  }, [socket, socketUserId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
