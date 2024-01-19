import React, { createContext, useContext, useState } from 'react';

const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [selectedText, setSelectedText] = useState('');
  const [todos, setTodos] = useState([]);

  const updateSelectedText = (text) => {
    setSelectedText(text);
  };

  const updateTodos = (updatedTodos) => {
    setTodos(updatedTodos);
  };

  return (
    <TemplateContext.Provider value={{ selectedText, updateSelectedText, todos, updateTodos }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => useContext(TemplateContext);
