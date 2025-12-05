import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    { title: "1 on 1", desc: "Individual therapy sessions", path: "/admin/one-on-one", color: "#4ECDC4" },
    { title: "Play Group", desc: "Group activity photos", path: "/admin/play-group", color: "#FF6B6B" },
    { title: "Enroll Child", desc: "Register new students", path: "/admin/enroll-child", color: "#FFE66D" },
    { title: "Manage Teachers", desc: "Add teachers & specs", path: "/admin/manage-teachers", color: "#95E1D3" },
    { title: "Other Services", desc: "Configure services", path: "/admin/services", color: "#1A535C" }
  ];

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Manage school operations">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {menuItems.map((item, index) => (
          <Card 
            key={index}
            title={item.title}
            color={item.color}
            onClick={() => navigate(item.path)}
          >
            <p style={{ margin: 0, color: '#555' }}>{item.desc}</p>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;