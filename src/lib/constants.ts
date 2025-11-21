// Valid status values for waste reports
export const VALID_REPORT_STATUSES = [
  'pending',
  'assigned',
  'in_progress',
  'resolved',
  'rejected'
] as const;

export type ReportStatus = typeof VALID_REPORT_STATUSES[number];

// Valid severity levels
export const VALID_SEVERITY_LEVELS = [
  'low',
  'medium',
  'high'
] as const;

export type SeverityLevel = typeof VALID_SEVERITY_LEVELS[number];

// Valid waste types
export const VALID_WASTE_TYPES = [
  'plastic',
  'paper',
  'food',
  'hazardous',
  'mixed',
  'other'
] as const;

export type WasteType = typeof VALID_WASTE_TYPES[number];

// Valid cleaner availability statuses
export const VALID_AVAILABILITY_STATUSES = [
  'available',
  'busy',
  'off_duty'
] as const;

export type AvailabilityStatus = typeof VALID_AVAILABILITY_STATUSES[number];

// Validation functions
export const isValidReportStatus = (status: string): status is ReportStatus => {
  return VALID_REPORT_STATUSES.includes(status as ReportStatus);
};

export const isValidSeverity = (severity: string): severity is SeverityLevel => {
  return VALID_SEVERITY_LEVELS.includes(severity as SeverityLevel);
};

export const isValidWasteType = (wasteType: string): wasteType is WasteType => {
  return VALID_WASTE_TYPES.includes(wasteType as WasteType);
};

export const isValidAvailability = (status: string): status is AvailabilityStatus => {
  return VALID_AVAILABILITY_STATUSES.includes(status as AvailabilityStatus);
};

// Status display helpers
export const getStatusLabel = (status: ReportStatus): string => {
  const labels: Record<ReportStatus, string> = {
    pending: 'Pending',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected'
  };
  return labels[status];
};

export const getSeverityLabel = (severity: SeverityLevel): string => {
  const labels: Record<SeverityLevel, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  };
  return labels[severity];
};
