import React from "react";
import "./generalfooter.css";

const GeneralFooter = ({ pageLabel = "" }) => {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <span>Little Lions Learning and Development Center</span>
        <span>littlelionsldc@gmail.com</span>
        <span>(+63) 9677900903</span>

        {pageLabel && (
          <>
            <span className="app-footer-sep">•</span>
            <span>{pageLabel}</span>
          </>
        )}
      </div>
    </footer>
  );
};

export default GeneralFooter;
