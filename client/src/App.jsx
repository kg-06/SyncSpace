import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import Board from "./pages/Board";
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace/:workspaceId" element={<Workspace />} />
          <Route path="/workspace/:workspaceId/board/:id" element={<Board />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;