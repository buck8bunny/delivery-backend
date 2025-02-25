import React, { createContext, useContext, useState } from "react";
import { Text } from "react-native";

// Создаем контекст
const UserContext = createContext();

export function UserProvider({ children }) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");

  const updateUserName = (name) => {
    setUserName(name);
  };

  const updateEmail = (newEmail) => {
    setEmail(newEmail);
  };

  return (
    <UserContext.Provider 
      value={{ 
        userName, 
        updateUserName,
        email,
        updateEmail
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserProvider; 
