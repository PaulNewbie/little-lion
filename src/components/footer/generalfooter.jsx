import React from "react";
import { Mail, Phone } from "lucide-react";
import "./generalfooter.css";
import logo from "../../images/logo.png";

const GeneralFooter = ({ pageLabel = "" }) => {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-item">
          <div className="app-footer-logo">
            <img src={logo} alt="Little Lions" className="app-footer-logo-img" />
          </div>
          <span>Little Lions Learning and Development Center</span>
        </div>
        <span className="app-footer-divider">•</span>
        <div className="app-footer-item">
          <Mail size={18} className="app-footer-icon" />
          <span>littlelionsldc@gmail.com</span>
        </div>
        <span className="app-footer-divider">•</span>
        <div className="app-footer-item">
          <Phone size={18} className="app-footer-icon" />
          <span>(+63) 9677900930</span>
        </div>
      </div>
    </footer>
  );
};

export default GeneralFooter;