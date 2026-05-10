import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useRoles } from "../hooks/useRoles";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { userId } = useRoles();

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    if (userId) {
      newSocket.emit("register", userId);
    }

    return () => newSocket.disconnect();
  }, [userId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
