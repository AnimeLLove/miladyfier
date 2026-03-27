export interface RuntimeImageFeatures {
  hash: string;
  averageColor: [number, number, number];
  legacyFeatures: number[];
  modelTensor: number[];
  modelShape: [1, 3, 128, 128];
}
