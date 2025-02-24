import React, { createContext, useContext, useState } from "react";
import { Text } from "react-native";

// Создаем контекст
const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [userName, setUserName] = useState("");

  const updateUserName = (newName) => {
    setUserName(newName);
  };

  return (
    <UserContext.Provider value={{ userName, updateUserName }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider; 
