const TRUST_PRESETS = {
  official_university: { score: 100, label: 'Official University', autoVerify: true },
  government_scholarship: { score: 100, label: 'Government Scholarship Portal', autoVerify: true },
  film_festival_official: { score: 95, label: 'Film Festival Official Site', autoVerify: false },
  industry_organization: { score: 85, label: 'Recognized Industry Organization', autoVerify: false },
  unknown: { score: 0, label: 'Unknown Source', autoVerify: false, needsReview: true },
};

const AUTO_VERIFY_THRESHOLD = 100;

function getTrustPreset(key) {
  return TRUST_PRESETS[key] || TRUST_PRESETS.unknown;
}

function resolveVerificationStatus(trustLevel, { isDuplicate = false } = {}) {
  if (isDuplicate) return 'needs_review';
  if (trustLevel >= AUTO_VERIFY_THRESHOLD) return 'verified';
  if (trustLevel === 0) return 'needs_review';
  return 'pending';
}

function resolvePublicationStatus(trustLevel) {
  // Never auto-publish discovered records — always draft until human approval
  return 'draft';
}

function resolveConfidenceScore(trustLevel, isDuplicate) {
  if (isDuplicate) return 0.5;
  return Math.min(1.0, Math.max(0.1, trustLevel / 100));
}

function getTrustLabel(trustLevel) {
  if (trustLevel >= 100) return TRUST_PRESETS.official_university.label;
  if (trustLevel >= 95) return TRUST_PRESETS.film_festival_official.label;
  if (trustLevel >= 85) return TRUST_PRESETS.industry_organization.label;
  if (trustLevel > 0) return `Trust Level ${trustLevel}`;
  return TRUST_PRESETS.unknown.label;
}

module.exports = {
  TRUST_PRESETS,
  AUTO_VERIFY_THRESHOLD,
  getTrustPreset,
  resolveVerificationStatus,
  resolvePublicationStatus,
  resolveConfidenceScore,
  getTrustLabel,
};