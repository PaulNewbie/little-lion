export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin', 
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  THERAPIST: 'therapist'
};

export const SERVICE_TYPES = {
  SPEECH_THERAPY: 'Speech Therapy',
  BEHAVIORAL_THERAPY: 'Behavioral Therapy',
  OCCUPATIONAL_THERAPY: 'Occupational Therapy',
  ART_CLASS: 'Art Class',
  MUSIC_CLASS: 'Music Class',
  PHYSICAL_THERAPY: 'Physical Therapy'
};

export const ACTIVITY_TYPES = {
  ONE_ON_ONE: 'one_on_one',
  PLAY_GROUP: 'play_group'
};

// UUID generator polyfill for browsers that don't support crypto.randomUUID
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
  });
}