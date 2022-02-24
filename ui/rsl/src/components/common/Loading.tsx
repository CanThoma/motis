import React from "react";

const Loading = () => {
  return (
    <div className="flex justify-center max-w-sm mx-auto">
      <div className="lds-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

export default Loading;
