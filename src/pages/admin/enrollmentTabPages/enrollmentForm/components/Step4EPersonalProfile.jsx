import React from "react";
import SpeechToTextTextarea from "./SpeechToTextTextarea";

// Common strength categories
const STRENGTH_CATEGORIES = [
  { key: "visual", label: "Visual-Spatial Skills", hint: "Puzzles, art, recognizing patterns" },
  { key: "memory", label: "Memory", hint: "Remembering details, sequences, routines" },
  { key: "motor", label: "Motor Skills", hint: "Fine or gross motor abilities" },
  { key: "music", label: "Musical Ability", hint: "Responding to music, rhythm, singing" },
  { key: "numbers", label: "Numbers/Math", hint: "Counting, number recognition, patterns" },
  { key: "language", label: "Language", hint: "Vocabulary, reading, verbal skills" },
  { key: "focus", label: "Focus/Attention", hint: "Sustained attention on preferred tasks" },
  { key: "creativity", label: "Creativity", hint: "Imagination, original ideas, problem-solving" },
];

// Interest categories
const INTEREST_CATEGORIES = [
  { key: "tv", label: "TV/Videos", examples: "Cartoons, movies, YouTube" },
  { key: "toys", label: "Toys/Objects", examples: "Building blocks, cars, dolls" },
  { key: "outdoors", label: "Outdoor Activities", examples: "Playing outside, water play" },
  { key: "art", label: "Art/Creative", examples: "Drawing, coloring, crafts" },
  { key: "music", label: "Music/Sounds", examples: "Singing, instruments, listening" },
  { key: "books", label: "Books/Reading", examples: "Picture books, stories" },
  { key: "physical", label: "Physical Play", examples: "Running, jumping, sports" },
  { key: "technology", label: "Technology", examples: "Tablets, computers, games" },
];

// Social interaction levels
const SOCIAL_INTERACTION_LEVELS = [
  { value: "", label: "Select..." },
  { value: "Avoids", label: "Avoids interactions" },
  { value: "Tolerates", label: "Tolerates when approached" },
  { value: "Parallel", label: "Prefers parallel play" },
  { value: "Emerging", label: "Emerging social interest" },
  { value: "Initiates", label: "Initiates interactions" },
  { value: "Age-appropriate", label: "Age-appropriate social skills" },
];

// Communication style options
const COMMUNICATION_STYLES = [
  { value: "", label: "Select..." },
  { value: "Non-verbal", label: "Non-verbal" },
  { value: "Limited verbal", label: "Limited verbal (single words)" },
  { value: "Phrases", label: "Uses phrases/short sentences" },
  { value: "Full sentences", label: "Full sentences" },
  { value: "Fluent", label: "Fluent verbal communication" },
];

// Eye contact levels
const EYE_CONTACT_LEVELS = [
  { value: "", label: "Select..." },
  { value: "Avoids", label: "Avoids eye contact" },
  { value: "Fleeting", label: "Fleeting/brief" },
  { value: "Improving", label: "Improving with prompts" },
  { value: "Functional", label: "Functional eye contact" },
  { value: "Appropriate", label: "Age-appropriate" },
];

export default function Step4EPersonalProfile({ data, onChange, errors = {} }) {
  // Initialize personal profile structure if not present
  const personalProfile = data.backgroundHistory?.personalProfile || {
    strengths: {},
    strengthNotes: "",
    interests: {},
    interestNotes: "",
    socialInteraction: "",
    communicationStyle: "",
    eyeContact: "",
    behaviorRegulation: "",
    socialNotes: "",
  };

  // Update personal profile
  const updateProfile = (field, value) => {
    const updated = { ...personalProfile, [field]: value };
    onChange("backgroundHistory", "personalProfile", updated);

    // Generate legacy text fields
    onChange("backgroundHistory", "strengthsAndInterests", generateStrengthsText(updated));
    onChange("backgroundHistory", "socialSkills", generateSocialText(updated));
  };

  // Toggle strength
  const toggleStrength = (key) => {
    const updated = {
      ...personalProfile,
      strengths: {
        ...personalProfile.strengths,
        [key]: !personalProfile.strengths?.[key]
      }
    };
    onChange("backgroundHistory", "personalProfile", updated);
    onChange("backgroundHistory", "strengthsAndInterests", generateStrengthsText(updated));
  };

  // Toggle interest
  const toggleInterest = (key) => {
    const updated = {
      ...personalProfile,
      interests: {
        ...personalProfile.interests,
        [key]: !personalProfile.interests?.[key]
      }
    };
    onChange("backgroundHistory", "personalProfile", updated);
    onChange("backgroundHistory", "strengthsAndInterests", generateStrengthsText(updated));
  };

  // Generate legacy strengths and interests text
  const generateStrengthsText = (profile) => {
    const parts = [];

    // Strengths
    const selectedStrengths = STRENGTH_CATEGORIES
      .filter(s => profile.strengths?.[s.key])
      .map(s => s.label);
    if (selectedStrengths.length > 0) {
      parts.push(`Strengths: ${selectedStrengths.join(", ")}`);
    }
    if (profile.strengthNotes) {
      parts.push(profile.strengthNotes);
    }

    // Interests
    const selectedInterests = INTEREST_CATEGORIES
      .filter(i => profile.interests?.[i.key])
      .map(i => i.label);
    if (selectedInterests.length > 0) {
      parts.push(`Interests: ${selectedInterests.join(", ")}`);
    }
    if (profile.interestNotes) {
      parts.push(profile.interestNotes);
    }

    return parts.join(". ") + (parts.length ? "." : "");
  };

  // Generate legacy social skills text
  const generateSocialText = (profile) => {
    const parts = [];

    if (profile.socialInteraction) {
      parts.push(`Social interaction: ${profile.socialInteraction}`);
    }
    if (profile.communicationStyle) {
      parts.push(`Communication: ${profile.communicationStyle}`);
    }
    if (profile.eyeContact) {
      parts.push(`Eye contact: ${profile.eyeContact}`);
    }
    if (profile.behaviorRegulation) {
      parts.push(`Behavior regulation: ${profile.behaviorRegulation}`);
    }
    if (profile.socialNotes) {
      parts.push(profile.socialNotes);
    }

    return parts.join(". ") + (parts.length ? "." : "");
  };

  return (
    <div className="form-section">
      <h3 className="section-title">IV-E. PERSONAL PROFILE</h3>
      <p className="section-description">
        Describe the child's strengths, interests, and social abilities.
      </p>

      {/* Strengths Section */}
      <div className="form-section-group">
        <h4 className="subsection-title">Strengths & Abilities</h4>
        <p className="field-hint" style={{ marginBottom: "12px" }}>
          Select areas where the child shows strength or ability:
        </p>

        <div className="checkbox-grid">
          {STRENGTH_CATEGORIES.map((strength) => (
            <label key={strength.key} className="checkbox-card">
              <input
                type="checkbox"
                checked={personalProfile.strengths?.[strength.key] || false}
                onChange={() => toggleStrength(strength.key)}
              />
              <div className="checkbox-card-content">
                <span className="checkbox-card-label">{strength.label}</span>
                <span className="checkbox-card-hint">{strength.hint}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="input-group" style={{ marginTop: "16px" }}>
          <label>Additional Strength Notes</label>
          <SpeechToTextTextarea
            rows={2}
            value={personalProfile.strengthNotes || ""}
            onChange={(e) => updateProfile("strengthNotes", e.target.value)}
            placeholder="Describe any specific strengths or abilities in detail. Click 🎤 to dictate..."
          />
        </div>
      </div>

      {/* Interests Section */}
      <div className="form-section-group" style={{ marginTop: "24px" }}>
        <h4 className="subsection-title">Interests & Motivators</h4>
        <p className="field-hint" style={{ marginBottom: "12px" }}>
          Select the child's preferred activities and interests:
        </p>

        <div className="checkbox-grid">
          {INTEREST_CATEGORIES.map((interest) => (
            <label key={interest.key} className="checkbox-card">
              <input
                type="checkbox"
                checked={personalProfile.interests?.[interest.key] || false}
                onChange={() => toggleInterest(interest.key)}
              />
              <div className="checkbox-card-content">
                <span className="checkbox-card-label">{interest.label}</span>
                <span className="checkbox-card-hint">{interest.examples}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="input-group" style={{ marginTop: "16px" }}>
          <label>Specific Interests</label>
          <SpeechToTextTextarea
            rows={2}
            value={personalProfile.interestNotes || ""}
            onChange={(e) => updateProfile("interestNotes", e.target.value)}
            placeholder="List specific interests (favorite shows, toys, activities). Click 🎤 to dictate..."
          />
        </div>
      </div>

      {/* Social Skills Section */}
      <div className="form-section-group" style={{ marginTop: "24px" }}>
        <h4 className="subsection-title">Social Skills</h4>

        <div className="form-row">
          <div className="input-group">
            <label>Peer Interaction Level</label>
            <select
              value={personalProfile.socialInteraction || ""}
              onChange={(e) => updateProfile("socialInteraction", e.target.value)}
            >
              {SOCIAL_INTERACTION_LEVELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Communication Style</label>
            <select
              value={personalProfile.communicationStyle || ""}
              onChange={(e) => updateProfile("communicationStyle", e.target.value)}
            >
              {COMMUNICATION_STYLES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Eye Contact</label>
            <select
              value={personalProfile.eyeContact || ""}
              onChange={(e) => updateProfile("eyeContact", e.target.value)}
            >
              {EYE_CONTACT_LEVELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Behavior Regulation</label>
            <input
              type="text"
              value={personalProfile.behaviorRegulation || ""}
              onChange={(e) => updateProfile("behaviorRegulation", e.target.value)}
              placeholder="e.g., Responds to redirection, needs sensory breaks"
            />
          </div>
        </div>

        <div className="input-group">
          <label>Additional Social Notes</label>
          <SpeechToTextTextarea
            rows={2}
            value={personalProfile.socialNotes || ""}
            onChange={(e) => updateProfile("socialNotes", e.target.value)}
            placeholder="Any other relevant information about social skills. Click 🎤 to dictate..."
          />
        </div>
      </div>

      {/* Validation Error */}
      {(errors.strengthsAndInterests || errors.socialSkills) && (
        <div className="field-error-message" style={{ marginTop: "16px" }}>
          Please provide information about the child's strengths and social skills.
        </div>
      )}
    </div>
  );
}
