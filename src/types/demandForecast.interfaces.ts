export interface DemandForecastPredictRequest {
  DayOfWeek: number;
  IsWeekend: number;
  IsHoliday: number;
  Temperature: number;
  Weather: string;
}

export interface DemandForecastDTO {
  id?: string;
  templateId: string;
  createdBy: string;
  targetDate: string;
  dateDetails: string;
  temperature: number;
  predictedGuests: number;
  weatherFeature: string;
  isHoliday: boolean;
  createdAt?: string;
  updatedAt?: string;
}
