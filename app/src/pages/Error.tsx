import React from 'react';

const Error = ({code} : {code:any}) => {
  return (
    <div className="error">
        <h1>{code}</h1>
    </div>
  );
};

export default Error;
