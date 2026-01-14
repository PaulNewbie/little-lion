import React from "react";
import "./generalfooter.css";
import logo from "../../images/logo.png";

const GeneralFooter = ({ pageLabel = "" }) => {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <span className="app-footer-logo"><img src={logo} alt="Little Lions Logo" /></span>
        <span>Little Lions Learning and Development Center</span>
        <span>• littlelionsldc@gmail.com</span>
        <span>• (+63) 9677900903</span>

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