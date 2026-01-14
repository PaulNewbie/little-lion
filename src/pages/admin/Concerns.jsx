import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminSidebar from '../../components/sidebar/AdminSidebar';

import './css/Concerns.css';

const Concerns = () => {
  return (
    <div className="ac-page-wrapper">
      <AdminSidebar />

      <div> Admin Concerns Page</div>
    </div>
  );
}


export default Concerns;