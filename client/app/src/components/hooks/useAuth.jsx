import React, { createContext, useContext, useEffect, useState } from "react";
import { getAccessToken, clearTokens } from "../../utils/auth";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState("Viewer");
  const [access, setAccess] = useState(getAccessToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAccess(getAccessToken());
  }, [])

  // Fetch user when access token changes
  useEffect(() => {
    const fetchUser = async () => {
      if (!access) {
        setUser(null);
        setUserType("Viewer");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/users/profile/`,
          {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        );

        if (!res.ok) {
          // Token might be expired or invalid
          console.warn("Access token invalid or expired.");
          clearTokens();
          setUser(null);
          setUserType("Viewer");
          return;
        }

        const data = await res.json();
        setUser(data);
        setUserType(
          Array.isArray(data.role) ? data.role[0] : data.role || "User"
        );
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setUser(null);
        setUserType("Viewer");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [access]);

  return (
    <UserContext.Provider value={{ user, userType, setUser, updateUser: setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
