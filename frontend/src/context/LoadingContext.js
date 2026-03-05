import React, { createContext, useState, useContext } from 'react';

const LoadingContext = createContext();

export const useLoading = (key) => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  
  const { loadingStates, setLoading } = context;
  
  return [
    loadingStates[key] || false,
    (state) => setLoading(key, state)
  ];
};

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = (key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  };

  const isLoading = (key) => {
    return loadingStates[key] || false;
  };

  const resetLoading = () => {
    setLoadingStates({});
  };

  const value = {
    loadingStates,
    setLoading,
    isLoading,
    resetLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingContext;
