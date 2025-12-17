import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService'; 
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const TherapistDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch Real Students from Firebase
  useEffect(() => {
    const fetchMyStudents = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        // This service function is already perfect - it gets only your students
        const myStudents = await childService.getChildrenByTherapistId(currentUser.uid);
        setStudents(myStudents);
      } catch (err) {
        setError('Failed to load assigned students.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyStudents();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 2. Helper to find the specific service assignment object
  const getServiceAssignment = (student) => {
    // Look through the student's services to find the one assigned to ME (the current user)
    return student.therapyServices?.find(s => s.therapistId === currentUser.uid);
  };

  // 3. The "Start Session" Logic
  const handleStartSession = (student) => {
    const serviceAssignment = getServiceAssignment(student);

    if (!serviceAssignment) {
      alert("Error: You are not assigned to a specific service for this student.");
      return;
    }

    // Navigate to the form, passing the REAL Child and Service data
    navigate('/therapist/session-form', { 
      state: { 
        child: student, 
        service: {
          id: serviceAssignment.serviceId,
          name: serviceAssignment.serviceName // This name triggers the specific form (OT vs SPED)
        }
      } 
    });
  };

  if (loading) return <Loading />;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Therapist Dashboard 🦁</h1>
          <p className="text-gray-500 mt-1">
            {currentUser?.firstName} {currentUser?.lastName} • <span className="text-indigo-600 font-medium">{currentUser?.specializations?.join(', ')}</span>
          </p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => navigate('/staff/inquiries')}
                className="px-4 py-2 bg-yellow-400 text-gray-800 font-bold rounded-lg hover:bg-yellow-500 transition-colors shadow-sm"
            >
                📩 Inbox
            </button>
            <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
                Logout
            </button>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Caseload Section */}
      <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
        📂 My Caseload <span className="bg-indigo-100 text-indigo-700 text-sm px-2 py-0.5 rounded-full">{students.length}</span>
      </h2>

      {students.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No students are currently assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(student => {
            const myService = getServiceAssignment(student);
            
            return (
              <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group">
                {/* Card Header */}
                <div className="p-5 flex items-start gap-4 border-b border-gray-50 bg-gray-50/50">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl border-2 border-white shadow-sm overflow-hidden">
                    {student.photoUrl ? (
                      <img src={student.photoUrl} alt={student.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span>👶</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-indigo-600 transition-colors">
                      {student.firstName} {student.lastName}
                    </h3>
                    {myService && (
                      <span className="inline-block mt-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded font-semibold border border-indigo-100">
                        {myService.serviceName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="text-sm text-gray-500 space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="font-medium">Date of Birth:</span>
                      <span>{student.dateOfBirth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Medical Info:</span>
                      <span className="truncate max-w-[150px]" title={student.medicalInfo || 'None'}>
                        {student.medicalInfo || 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* PRIMARY ACTION: Starts the Dynamic Form */}
                    <button 
                      onClick={() => handleStartSession(student)}
                      className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>📝 Start Session</span>
                    </button>
                    
                    <button className="w-full py-2.5 bg-white text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      View History
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TherapistDashboard;