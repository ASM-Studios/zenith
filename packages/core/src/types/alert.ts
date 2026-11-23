export const ALERT_SEVERITIES = ['minor', 'moderate', 'severe', 'extreme'] as const;

export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_HAZARDS = [
  'wind',
  'rain',
  'thunderstorm',
  'snow-ice',
  'flood',
  'heat',
  'cold',
  'fog',
  'avalanche',
  'coastal',
  'wildfire',
  'other',
] as const;

export type AlertHazard = (typeof ALERT_HAZARDS)[number];

export interface Alert {
  readonly id: string;
  readonly hazard: AlertHazard;
  readonly severity: AlertSeverity;
  readonly onset: string;
  readonly expires: string;
  readonly title: string;
  readonly description?: string;
  readonly issuer: string;
}
