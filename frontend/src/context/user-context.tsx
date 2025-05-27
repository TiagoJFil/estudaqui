import React, { createContext, useContext, useState, ReactNode } from "react";

interface UserContextType {
  credits: number;
  setCredits: (credits: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [credits, setCredits] = useState(0);

  return (
    <UserContext.Provider value={{ credits, setCredits }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};