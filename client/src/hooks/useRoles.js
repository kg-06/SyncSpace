import { jwtDecode } from "jwt-decode";

export const useRoles = (workspace) => {
  const token = localStorage.getItem("token");
  let userId = null;
  
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userId = decoded.id; // Assuming backend puts user id in 'id' or '_id'
    } catch (e) {
      console.error("Invalid token");
    }
  }

  const isOwner = workspace?.owner === userId;
  
  const memberObj = workspace?.members?.find((m) => {
    // the user field might be populated (an object) or just an ID string
    const mId = typeof m.user === 'object' ? m.user._id : m.user;
    return mId === userId;
  });

  const role = memberObj ? memberObj.role : null;
  
  const isLead = isOwner || role === "lead";
  const isMember = isLead || role === "member"; // lead is also a member

  return { userId, isOwner, isLead, isMember, role };
};
