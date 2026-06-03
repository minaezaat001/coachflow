export interface BodyMeasurements {
  stomach: string;
  chest: string;
  neck: string;
  leg: string;
  arm: string;
  butt: string;
}

export interface PhotoUrls {
  front: string;
  side: string;
  back: string;
  inbody: string;
}

export interface OnboardingData {
  jobDetails: string;
  photos: PhotoUrls;
  bodyMeasurements: BodyMeasurements;
  proteinSources: string[];
  carbSources: string[];
  fatSources: string[];
  foodAllergies: string;
  mealCount: string;
  sugarCount: string;
  smokingDetails: string;
  workoutLocation: string;
  workoutDaysCount: string;
  injuries: string;
}

export interface OnboardingRecord {
  id: number;
  clientId: number;
  data: OnboardingData;
  submittedAt: string;
}
