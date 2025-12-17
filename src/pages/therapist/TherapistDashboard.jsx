import React, { useState, useEffect, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');

  // --- 1. Fetch Logic (Unchanged) ---
  useEffect(() => {
    const fetchMyStudents = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
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

  // --- 2. Helper Logic ---
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getServiceAssignment = (student) => {
    return student.therapyServices?.find(s => s.therapistId === currentUser.uid);
  };

  const handleStartSession = (student) => {
    const serviceAssignment = getServiceAssignment(student);

    if (!serviceAssignment) {
      alert("Error: You are not assigned to a specific service for this student.");
      return;
    }

    navigate('/therapist/session-form', { 
      state: { 
        child: student, 
        service: {
          id: serviceAssignment.serviceId,
          name: serviceAssignment.serviceName
        }
      } 
    });
  };

  // --- 3. New UI Logic ---
  
  // Filter students based on search
  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // Dynamic Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦁</span>
              <span className="font-bold text-xl tracking-tight text-indigo-900">Little Lion</span>
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold ml-2">Therapist Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/staff/inquiries')}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <span>📩</span>
                <span className="hidden sm:inline font-medium">Inbox</span>
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <button 
                onClick={handleLogout} 
                className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {getGreeting()}, {currentUser?.firstName}! 👋
            </h1>
            <p className="text-gray-500">
              You are logged in as a <span className="font-semibold text-indigo-600">{currentUser?.specializations?.join(', ') || 'Therapist'}</span>.
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="flex gap-4">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 pr-6">
              <div className="p-2 bg-indigo-50 rounded-lg text-xl">📂</div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Caseload</p>
                <p className="text-xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
            {/* You could add more stats here later, like "Sessions Today" */}
          </div>
        </div>

        <ErrorMessage message={error} />

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 w-full sm:w-auto">
            My Students <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{filteredStudents.length}</span>
          </h2>
          <div className="relative w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Search student name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">🦁</div>
            <h3 className="text-xl font-bold text-gray-900">No students found</h3>
            <p className="text-gray-500 mt-2">
              {searchTerm ? `No matches for "${searchTerm}"` : "You haven't been assigned any students yet."}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="mt-4 text-indigo-600 font-medium hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(student => {
              const myService = getServiceAssignment(student);
              
              return (
                <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                  
                  {/* Card Header with Color Accent */}
                  <div className="h-2 bg-indigo-500 w-full"></div>
                  
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-2xl border border-indigo-100 overflow-hidden">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <span>👤</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 leading-tight">
                            {student.firstName} {student.lastName}
                          </h3>
                          <span className="text-xs text-gray-500 block mt-1">
                            DOB: {student.dateOfBirth}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badge */}
                    {myService && (
                      <div className="mb-4">
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-full border border-indigo-100">
                           🩺 {myService.serviceName}
                         </span>
                      </div>
                    )}

                    {/* Medical Info Snippet */}
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-2">
                      <span className="font-semibold text-gray-700 block text-xs uppercase tracking-wide mb-1">Medical Notes</span>
                      <p className="line-clamp-2">
                        {student.medicalInfo || <span className="text-gray-400 italic">No notes available.</span>}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer / Actions */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => alert('View History Feature Coming Soon!')}
                      className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      📜 History
                    </button>
                    <button 
                      onClick={() => handleStartSession(student)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>📝</span> Session
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default TherapistDashboard;