export interface CloudCover {
  readonly total: number;
  readonly low?: number;
  readonly mid?: number;
  readonly high?: number;
}

export interface Wind {
  readonly speedMs: number;
  readonly gustMs?: number;
  readonly directionDeg?: number;
}

export interface CurrentConditions {
  readonly time: string;
  readonly temperatureC: number;
  readonly apparentTemperatureC?: number;
  readonly relativeHumidity?: number;
  readonly pressureHpa?: number;
  readonly precipitationMm?: number;
  readonly wind: Wind;
  readonly cloudCover: CloudCover;
  readonly visibilityM?: number;
  readonly weatherCode?: string;
}

export interface HourlyForecast {
  readonly time: string;
  readonly temperatureC: number;
  readonly relativeHumidity?: number;
  readonly precipitationMm: number;
  readonly precipitationProbability?: number;
  readonly wind: Wind;
  readonly cloudCover: CloudCover;
  readonly visibilityM?: number;
  readonly weatherCode?: string;
}

export interface DailyForecast {
  readonly date: string;
  readonly temperatureMinC: number;
  readonly temperatureMaxC: number;
  readonly precipitationMm: number;
  readonly precipitationProbability?: number;
  readonly windSpeedMaxMs?: number;
  readonly sunrise?: string;
  readonly sunset?: string;
  readonly weatherCode?: string;
}
