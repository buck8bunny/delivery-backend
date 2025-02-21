import React, { createContext, useContext, useState } from "react";

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
