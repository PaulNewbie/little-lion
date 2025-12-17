import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveSessionActivity } from '../../services/activityService'; // You'll create this next
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

const TherapySessionForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { child, service } = location.state || {};

  // --- State Management ---
  const [loading, setLoading] = useState(false);
  
  // Common Fields
  const [notes, setNotes] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [reaction, setReaction] = useState([]); // Array to store multiple reactions
  
  // Activity Based Fields (OT, Speech)
  const [activities, setActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState('');

  // Observation Based Fields (SPED, Language Enhancement)
  const [observationData, setObservationData] = useState({
    circleTime: '',
    workTime: '',
    playTime: '',
    snackTime: ''
  });

  // --- Logic to Determine Form Type ---
  const isActivityBased = ['Occupational Therapy', 'Speech Therapy', 'Occupational Service', 'Speech Service'].includes(service?.name);
  const isObservationBased = ['Sped Educational Therapy', 'Language and Communication Enhancement'].includes(service?.name);

  // --- Handlers ---

  const handleAddActivity = () => {
    if (!currentActivity.trim()) return;
    setActivities([...activities, { name: currentActivity, status: 'Completed', performance: '' }]);
    setCurrentActivity('');
  };

  const handleRemoveActivity = (index) => {
    const newActivities = activities.filter((_, i) => i !== index);
    setActivities(newActivities);
  };

  const toggleReaction = (mood) => {
    if (reaction.includes(mood)) {
      setReaction(reaction.filter(r => r !== mood));
    } else {
      setReaction([...reaction, mood]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const sessionData = {
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      serviceId: service.id,
      serviceName: service.name,
      date: new Date().toISOString(),
      // Conditional Data
      type: isActivityBased ? 'activity' : 'observation',
      data: isActivityBased ? { activities } : { observation: observationData },
      // Common Data
      studentReaction: reaction,
      sessionNotes: notes,
      recommendations: suggestions,
    };

    try {
      await saveSessionActivity(sessionData);
      alert('Session saved successfully!');
      navigate('/therapist/dashboard');
    } catch (error) {
      console.error("Error saving session", error);
      alert('Failed to save session.');
    } finally {
      setLoading(false);
    }
  };

  // --- UI Components ---

  const ReactionButton = ({ label, emoji }) => (
    <button
      type="button"
      onClick={() => toggleReaction(label)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border-2 ${
        reaction.includes(label) 
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md transform scale-105' 
          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
      }`}
    >
      <span className="text-2xl mb-1">{emoji}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );

  if (!child || !service) return <div className="p-8 text-center text-gray-500">No session details provided.</div>;
  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-2">
             ← Back to Dashboard
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">New Session Log</h1>
              <p className="text-gray-600 mt-1">
                Student: <span className="font-semibold text-indigo-600">{child.firstName} {child.lastName}</span> • Service: <span className="font-semibold text-indigo-600">{service.name}</span>
              </p>
            </div>
            <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* --- CONDITION 1: Activity Based Form (OT / Speech) --- */}
          {isActivityBased && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📋 Activity List
              </h2>
              <p className="text-sm text-gray-500 mb-6">Log the specific activities performed during this session.</p>

              {/* Add Activity Input */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={currentActivity}
                  onChange={(e) => setCurrentActivity(e.target.value)}
                  placeholder="Enter activity (e.g., 'Pincer Grasp Exercises', 'Vocabulary Drills')"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                />
                <button
                  type="button"
                  onClick={handleAddActivity}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Activities List */}
              <div className="space-y-3">
                {activities.length === 0 && <p className="text-center text-gray-400 italic py-4">No activities added yet.</p>}
                
                {activities.map((act, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100 group hover:border-indigo-200 transition-colors">
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">{index + 1}. {act.name}</span>
                    </div>
                    
                    {/* Optional: Performance Selector */}
                    <select 
                      className="mx-4 text-sm bg-white border border-gray-200 rounded p-1"
                      value={act.performance}
                      onChange={(e) => {
                        const newActs = [...activities];
                        newActs[index].performance = e.target.value;
                        setActivities(newActs);
                      }}
                    >
                      <option value="">Select Performance...</option>
                      <option value="Independent">Independent</option>
                      <option value="With Assistance">With Assistance</option>
                      <option value="Refused">Refused</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(index)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* --- CONDITION 2: Observation Based Form (SPED / Language) --- */}
          {isObservationBased && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                🏫 Today In... (Observation)
              </h2>
              <p className="text-sm text-gray-500 mb-6">Record observations for specific daily routines.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Circle Time</label>
                  <textarea
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Participation, attention span..."
                    value={observationData.circleTime}
                    onChange={(e) => setObservationData({...observationData, circleTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Work Time / Table Top</label>
                  <textarea
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Task completion, focus..."
                    value={observationData.workTime}
                    onChange={(e) => setObservationData({...observationData, workTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Play Time / Social</label>
                  <textarea
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Interaction with peers..."
                    value={observationData.playTime}
                    onChange={(e) => setObservationData({...observationData, playTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Snack / Lunch</label>
                  <textarea
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Independence, eating habits..."
                    value={observationData.snackTime}
                    onChange={(e) => setObservationData({...observationData, snackTime: e.target.value})}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* --- COMMON SECTIONS (Reaction, Notes, Suggestions) --- */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Student Feedback & Notes</h2>
            
            {/* Reaction Grid */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Student's Reaction (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <ReactionButton label="Happy" emoji="😊" />
                <ReactionButton label="Focused" emoji="🧐" />
                <ReactionButton label="Active" emoji="⚡" />
                <ReactionButton label="Distracted" emoji="😶‍🌫️" />
                <ReactionButton label="Upset" emoji="😢" />
                <ReactionButton label="Tired" emoji="🥱" />
                <ReactionButton label="Social" emoji="👋" />
                <ReactionButton label="Quiet" emoji="🤐" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Session Notes</label>
                <textarea
                  required
                  rows="5"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Detailed observations about the session..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Suggestions for Home/Classroom</label>
                <textarea
                  required
                  rows="5"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Homework, drills, or environmental adjustments..."
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white text-lg font-semibold px-8 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-400"
            >
              {loading ? 'Saving Session...' : 'Save & Complete Session'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TherapySessionForm;