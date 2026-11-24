import React, { useEffect } from 'react';

const PromptComponent = ({ condition }) => {
  useEffect(() => {

    const handleBeforeUnload = (event) => {
      if (condition) {
        event.preventDefault();
        event.returnValue = ""; 
        return "";
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };

  }, [condition]); 
  return null;
};

export default PromptComponent;
