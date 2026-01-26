/**
 * SeedButton.jsx
 * * Creates 10 test students in ASSESSING status (Steps 1-12 complete)
 * Step 13 (Service Enrollment) left empty for manual completion
 * * IMPROVED: Expanded name lists and randomized selection for better variety.
 */

import React, { useState } from 'react';
import { collection, doc, setDoc, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';

// Generate UUID
const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (startY, endY) => {
  const start = new Date(startY, 0, 1), end = new Date(endY, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};
const calcAge = dob => {
  const today = new Date(), birth = new Date(dob);
  let y = today.getFullYear() - birth.getFullYear(), m = today.getMonth() - birth.getMonth();
  if (m < 0) { y--; m += 12; }
  return `${y} years, ${m} months`;
};

// Helper to get n unique random items from an array
const getUniqueRandoms = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Expanded Test Data
const DATA = {
  firstNames: [
    'Sofia', 'Lucas', 'Emma', 'Noah', 'Olivia', 'Liam', 'Ava', 'Ethan', 'Mia', 'Aiden',
    'Isabella', 'Mason', 'Amelia', 'Jacob', 'Charlotte', 'William', 'Harper', 'Jayden',
    'Evelyn', 'Michael', 'Abigail', 'Alexander', 'Emily', 'Elijah', 'Elizabeth', 'Daniel',
    'Mila', 'Matthew', 'Ella', 'James', 'Avery', 'Benjamin', 'Camila', 'Sebastian',
    'Aria', 'Jack', 'Scarlett', 'Luke', 'Victoria', 'Henry', 'Chloe', 'Andrew', 'Grace',
    'Gabriel', 'Zoey', 'David', 'Nora', 'Carter', 'Lily', 'Wyatt', 'Miguel', 'Angelo', 
    'Jasmine', 'Bea', 'Paulo', 'Kylie', 'Rafael', 'Julia', 'Marco', 'Clara'
  ],
  lastNames: [
    'Garcia', 'Santos', 'Reyes', 'Cruz', 'Bautista', 'Gonzales', 'Torres', 'Dela Cruz',
    'Ramos', 'Flores', 'Mendoza', 'Castro', 'Villanueva', 'Rivera', 'Aquino', 'Navarro',
    'Mercado', 'Castillo', 'De Leon', 'Espiritu', 'Valdez', 'Salazar', 'Delos Santos',
    'Gregorio', 'Enriquez', 'Sison', 'Pascual', 'Fernandez', 'Lopez', 'Martinez',
    'Yap', 'Lim', 'Tan', 'Sy', 'Chua', 'Ong', 'Go', 'Gomez', 'Diaz', 'Soriano',
    'Dizon', 'Manalo', 'Salvador', 'Ferrer', 'Domingo', 'Santiago', 'Corpus', 'David'
  ],
  middleNames: ['Marie', 'Jose', 'Mae', 'Anne', 'James', 'Rose', 'Luis', 'Joy', 'Grace', 'Paul', 'John', ''],
  genders: ['male', 'female'],
  referralReasons: [
    'Parent expressed concerns about delayed speech development and limited vocabulary for age.',
    'School teacher noticed difficulty in following multi-step instructions and peer interactions.',
    'Pediatrician referred for evaluation due to motor coordination difficulties.',
    'Concerns about repetitive behaviors and limited eye contact during social interactions.',
    'Delayed achievement of developmental milestones compared to same-age peers.',
    'Difficulty with reading comprehension and letter recognition at expected age level.',
    'Behavioral concerns including attention difficulties and hyperactivity.',
    'Limited social engagement and preference for solitary play noted by caregivers.',
    'Fine motor skills challenges affecting handwriting and daily self-care.',
    'Language regression observed after previously meeting developmental targets.',
    'Sensory processing issues affecting daily routines (e.g., picky eating, noise sensitivity).',
    'Difficulty with emotional regulation and frequent tantrums.',
    'Struggles with transitions between activities and rigid behaviors.'
  ],
  assessmentPurposes: [
    ['Determine current developmental level', 'Identify areas of strength and weakness', 'Develop intervention plan'],
    ['Establish baseline functioning', 'Rule out developmental disorders', 'Provide recommendations'],
    ['Comprehensive cognitive evaluation', 'Assess adaptive behavior', 'Guide therapeutic interventions'],
    ['Evaluate speech and language', 'Assess social communication', 'Develop education goals'],
    ['Determine eligibility for special education', 'Identify learning needs', 'Create behavior strategies']
  ],
  familyBackgrounds: [
    'Child lives with both biological parents and one younger sibling in a stable home.',
    'Child is the only child living with mother and maternal grandparents.',
    'Child lives with both parents and two older siblings who help with caregiving.',
    'Child resides with adoptive parents who have provided nurturing environment.',
    'Child lives in extended family setting with parents, grandparents, and aunt.'
  ],
  familyRelationships: [
    'Strong attachment to caregivers. Responds well to siblings.',
    'Demonstrates secure attachment patterns with extended family.',
    'Shows preference for mother but relates well to all family members.',
    'Good rapport with parents. Some difficulty with sibling interactions.',
    'Warm relationship with caregivers. Enjoys time with grandmother.'
  ],
  dailyLifeActivities: [
    'Independent in basic self-care with supervision. Toilet trained.',
    'Requires assistance with most daily activities. Working on self-feeding.',
    'Mostly independent in daily routines. Needs reminders for hygiene.',
    'Developing independence in self-care. Regular sleep schedule.',
    'Semi-independent in daily tasks. Prefers routine.'
  ],
  medicalHistories: [
    'Full-term birth with no complications. Up-to-date on immunizations.',
    'Premature birth at 34 weeks. Required NICU stay. Currently healthy.',
    'Normal pregnancy and delivery. Had febrile seizure at age 2.',
    'C-section delivery. Mild asthma managed with inhaler.',
    'Unremarkable medical history. Hearing and vision passed.'
  ],
  schoolHistories: [
    'Currently enrolled in preschool. Teachers report attention difficulties.',
    'Attends special education preschool with speech therapy.',
    'Previous playgroup experience. Starting formal schooling.',
    'In daycare since age 2. Struggles with group activities.',
    'Home-schooled until recently. Transitioning to classroom.'
  ],
  clinicalDiagnoses: [
    'Global Developmental Delay', 
    'Autism Spectrum Disorder - Level 1', 
    'ADHD', 
    'Speech and Language Delay', 
    'Developmental Coordination Disorder',
    'Sensory Processing Disorder',
    'Social Communication Disorder'
  ],
  strengthsAndInterests: [
    'Strong visual memory. Enjoys music. Loves outdoor activities.',
    'Good gross motor abilities. Interested in vehicles.',
    'Creative with art. Strong attachment to family.',
    'Good imitation skills. Interested in animals.',
    'Persistence with preferred activities. Enjoys water play.',
    'Loves puzzles and building blocks. Very observant.',
    'Enjoys listening to stories and singing songs.'
  ],
  socialSkills: [
    'Beginning parallel play. Limited eye contact.',
    'Shows interest in peers but difficulty initiating.',
    'Prefers adult interaction over peers.',
    'Emerging joint attention skills.',
    'Appropriate greeting behaviors.'
  ],
  behaviorDuringAssessments: [
    'Cooperative throughout assessment. Initially shy but warmed up.',
    'Alert and engaged. Required frequent breaks.',
    'Assessment conducted over two sessions. Generally compliant.',
    'Hesitant at beginning but became comfortable.',
    'Cooperative behavior observed throughout.',
    'Demonstrated some anxiety but was redirectable.'
  ],
  assessmentTools: [
    { tool: 'Vineland Adaptive Behavior Scales-3', details: 'Adaptive functioning assessment' },
    { tool: 'Childhood Autism Rating Scale-2', details: 'Autism spectrum screening' },
    { tool: 'Peabody Developmental Motor Scales-2', details: 'Motor abilities evaluation' },
    { tool: 'Preschool Language Scales-5', details: 'Language assessment' },
    { tool: 'Bayley Scales of Infant Development-4', details: 'Developmental assessment' },
    { tool: 'Wechsler Preschool and Primary Scale of Intelligence-IV', details: 'Cognitive assessment' },
    { tool: 'Sensory Profile 2', details: 'Sensory processing evaluation' }
  ],
  assessmentResults: ['Below average', 'Average', 'Mild delay', 'Moderate delay', 'Age-appropriate', 'Significant delay'],
  recommendations: ['Continue therapy with increased frequency', 'Implement visual supports', 'Refer for further assessment', 'Begin school-based intervention', 'Parent training on strategies'],
  examiners: ['Dr. Maria Santos', 'Dr. Juan Reyes', 'Dr. Ana Cruz', 'Ms. Carmen Torres', 'Mr. Ricardo Bautista', 'Ms. Elena Gomez', 'Dr. Paolo Dizon'],
  cities: ['Quezon City', 'Manila', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong', 'San Juan', 'Caloocan'],
  streets: ['Mabini', 'Rizal', 'Bonifacio', 'Luna', 'Quezon', 'Aguinaldo', 'Jacinto', 'Burgos', 'Kalaw', 'Amorsolo'],
  schools: ['Little Stars Academy', 'Bright Minds Preschool', 'Happy Feet Learning Center', 'St. Mary\'s Kinder', 'Discovery Kids', '']
};

export default function SeedButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const handleSeed = async () => {
    if (!window.confirm('This will create 10 test students in ASSESSING status (Steps 1-12 complete, Step 13 empty). Continue?')) return;
    
    setIsSeeding(true);
    setResult(null);
    setLog([]);
    
    try {
      addLog('📋 Fetching services for interventions...');
      const servicesSnap = await getDocs(collection(db, 'services'));
      const services = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      addLog(`   Found ${services.length} services`);
      
      if (services.length === 0) throw new Error('No services found. Create some services first.');
      
      addLog('👥 Fetching parents...');
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() }));
      const parents = users.filter(u => u.role === 'parent');
      
      addLog(`   Found ${parents.length} parents`);
      
      if (parents.length === 0) throw new Error('No parents found. Create at least one parent.');
      
      addLog('🎓 Creating 10 students in ASSESSING status...');
      addLog('   (Steps 1-12 complete, Step 13 empty for you to fill)');
      addLog('');
      
      const created = [];
      
      // Get unique random names for this batch
      const batchFirstNames = getUniqueRandoms(DATA.firstNames, 10);
      const batchLastNames = getUniqueRandoms(DATA.lastNames, 10);
      
      for (let i = 0; i < 10; i++) {
        const parent = parents[i % parents.length];
        const firstName = batchFirstNames[i];
        const lastName = batchLastNames[i];
        const dateOfBirth = randomDate(2018, 2022);
        const now = new Date().toISOString();
        const childId = generateUUID();
        const assessmentId = generateUUID();
        
        // Select 2-3 services for INTERVENTIONS (Step 7) - NOT enrollments
        // This populates the dropdown in Step 13 for you to choose from 
        const selectedServices = [...services].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2) + 2);
        
        // Create interventions for Step 7 (Diagnosis & Interventions)
        // These will appear as options in Step 13 Service Enrollment
        const interventionsData = selectedServices.map(s => ({
          serviceName: s.name,
          serviceId: s.id,
          serviceType: s.type,
          frequency: randomFrom(['1x weekly', '2x weekly', '3x weekly']),
          duration: randomFrom(['30 minutes', '45 minutes', '60 minutes']),
          notes: `Recommended ${s.type === 'Therapy' ? 'therapy' : 'class'} intervention`
        }));
        
        // Create assessment tools with results
        const tools = [];
        const used = new Set();
        for (let j = 0; j < 3; j++) {
          let t;
          do { t = randomFrom(DATA.assessmentTools); } while (used.has(t.tool));
          used.add(t.tool);
          tools.push({ ...t, result: randomFrom(DATA.assessmentResults), recommendation: randomFrom(DATA.recommendations) });
        }
        
        const devBg = [
          { devBgTitle: 'Motor Development', devBgInfo: 'Walked at 14 months. Fine motor developing.' },
          { devBgTitle: 'Language Development', devBgInfo: 'First words at 18 months. Using 2-3 word phrases.' },
          { devBgTitle: 'Social Development', devBgInfo: 'Beginning to show interest in peer play.' },
          { devBgTitle: 'Cognitive Development', devBgInfo: 'Age-appropriate problem-solving.' }
        ];
        
        // Student data - ASSESSING status, NO service enrollments
        const studentData = {
          childId,
          id: childId,
          firstName,
          middleName: randomFrom(DATA.middleNames),
          lastName,
          nickname: firstName.slice(0, 3),
          dateOfBirth,
          gender: DATA.genders[i % 2],
          relationshipToClient: 'biological child',
          photoUrl: '',
          active: true,
          address: `${Math.floor(Math.random() * 999) + 1} ${randomFrom(DATA.streets)} St., ${randomFrom(DATA.cities)}`,
          school: randomFrom(DATA.schools),
          gradeLevel: randomFrom(['Nursery', 'Pre-K', 'Kindergarten', '']),
          assessmentDates: now.split('T')[0],
          examiner: randomFrom(DATA.examiners),
          ageAtAssessment: calcAge(dateOfBirth),
          assessmentId,
          
          // Step 2
          reasonForReferral: randomFrom(DATA.referralReasons),
          
          // Step 3
          purposeOfAssessment: DATA.assessmentPurposes[i % 5],
          
          // Steps 4-8: Background History
          backgroundHistory: {
            familyBackground: randomFrom(DATA.familyBackgrounds),
            familyRelationships: randomFrom(DATA.familyRelationships),
            dailyLifeActivities: randomFrom(DATA.dailyLifeActivities),
            medicalHistory: randomFrom(DATA.medicalHistories),
            developmentalBackground: devBg,
            schoolHistory: randomFrom(DATA.schoolHistories),
            clinicalDiagnosis: randomFrom(DATA.clinicalDiagnoses),
            // IMPORTANT: Interventions here populate Step 13 dropdown
            interventions: interventionsData,
            strengthsAndInterests: randomFrom(DATA.strengthsAndInterests),
            socialSkills: randomFrom(DATA.socialSkills)
          },
          
          // Step 9
          behaviorDuringAssessment: randomFrom(DATA.behaviorDuringAssessments),
          
          // Steps 10-12
          assessmentTools: tools,
          assessmentSummary: `Based on assessment, ${firstName} demonstrates areas requiring intervention. With appropriate supports, positive outcomes are anticipated.`,
          
          // Step 13: EMPTY - You will fill this manually
          serviceEnrollments: [],
          
          // No assigned staff yet
          assignedStaffIds: [],
          
          // Metadata
          parentId: parent.uid || parent.id,
          
          // KEY: Status is ASSESSING, not ENROLLED
          status: 'ASSESSING',
          
          createdAt: now,
          updatedAt: now
        };
        
        // Assessment data for separate collection
        const assessmentData = {
          id: assessmentId,
          childId,
          reasonForReferral: studentData.reasonForReferral,
          purposeOfAssessment: studentData.purposeOfAssessment,
          backgroundHistory: studentData.backgroundHistory,
          behaviorDuringAssessment: studentData.behaviorDuringAssessment,
          assessmentTools: studentData.assessmentTools,
          assessmentSummary: studentData.assessmentSummary,
          createdAt: now,
          updatedAt: now
        };
        
        // Save to Firestore
        await setDoc(doc(db, 'children', childId), studentData);
        await setDoc(doc(db, 'assessments', assessmentId), assessmentData);
        await updateDoc(doc(db, 'users', parent.uid || parent.id), { childrenIds: arrayUnion(childId) });
        
        created.push(`${firstName} ${lastName}`);
        const serviceNames = interventionsData.map(i => i.serviceName).join(', ');
        addLog(`   ✅ ${i + 1}. ${firstName} ${lastName}`);
        addLog(`      Parent: ${parent.firstName} ${parent.lastName}`);
        addLog(`      Recommended services: ${serviceNames}`);
      }
      
      setResult({ success: true, count: 10 });
      addLog('');
      addLog('════════════════════════════════════════════════════');
      addLog('🎉 Done! Created 10 students in ASSESSING status.');
      addLog('');
      addLog('📝 Next steps:');
      addLog('   1. Go to Enrollment page');
      addLog('   2. Click on any student to open their form');
      addLog('   3. Navigate to Step 13 (Service Enrollment)');
      addLog('   4. Select services and assign staff');
      addLog('   5. Click "Finish Enrollment"');
      addLog('════════════════════════════════════════════════════');
      
    } catch (error) {
      console.error('Seed failed:', error);
      setResult({ success: false, error: error.message });
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '2px dashed #e2e8f0',
      borderRadius: '12px',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>🧪 Test Data Seeder (V2)</h3>
      <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px' }}>
        Creates 10 students in <strong>ASSESSING</strong> status with random names
      </p>
      <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '13px' }}>
        Steps 1-12 complete • Step 13 (Service Enrollment) left empty for you
      </p>
      
      <button
        onClick={handleSeed}
        disabled={isSeeding}
        style={{
          padding: '12px 24px',
          backgroundColor: isSeeding ? '#94a3b8' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isSeeding ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        {isSeeding ? '⏳ Seeding...' : '🌱 Seed 10 Students (ASSESSING)'}
      </button>
      
      {result && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: result.success ? '#d1fae5' : '#fee2e2',
          borderRadius: '8px',
          color: result.success ? '#065f46' : '#991b1b'
        }}>
          {result.success 
            ? `✅ Created ${result.count} students! Go to Enrollment to complete Step 13.`
            : `❌ Error: ${result.error}`
          }
        </div>
      )}
      
      {log.length > 0 && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {log.map((msg, i) => (
            <div key={i} style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px', marginBottom: '4px', whiteSpace: 'pre-wrap' }}>
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}