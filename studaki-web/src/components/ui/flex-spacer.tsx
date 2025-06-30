import React from "react";

export default function FlexSpacer() {
  return (
    <div className="flex-1" style={{ minWidth: "0", minHeight: "0" }}>
      {/* This div will take up all available space in the flex container */}
    </div>
  );
}