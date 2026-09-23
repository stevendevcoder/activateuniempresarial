export interface AnalyticsSummary {
  total: number;
  programadas: number;
  completadas: number;
  aplazadas: number;
  canceladas: number;
  colaboradores: number;
  activeWorkers: number;
  activeAreas: number;
  complianceRate: number;
}

export interface TimelinePoint {
  period: string;
  total: number;
  completadas: number;
  programadas: number;
  aplazadas: number;
  canceladas: number;
}

export interface AreaCompliance {
  idArea: number | null;
  areaName: string;
  total: number;
  completadas: number;
  canceladas: number;
  colaboradores: number;
  complianceRate: number;
  workers: number;
}
