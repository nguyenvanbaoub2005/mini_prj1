export type FacilityCategory = 'Hardware' | 'Projector' | 'AC' | 'Electrical' | 'Furniture';

export type SyncStatus = 'DRAFT' | 'PENDING_SYNC' | 'SYNCED' | 'FAILED';

export interface SurveyFormData {
  // Bước 1: Vị trí
  building: string;
  floor: string;
  room: string;
  latitude?: number;
  longitude?: number;
  // Bước 2: Phân loại cơ sở vật chất
  category: FacilityCategory | '';
  // Bước 3: Tình trạng & Ghi chú lỗi
  rating: number; // 1 - 5 sao
  defectNotes: string;
  // Bước 4: Ảnh chụp hiện trường
  photoBase64?: string;
}

export interface SurveyRecord extends SurveyFormData {
  id: string;              // UUID duy nhất
  createdAt: string;       // ISO 8601 Timestamp
  updatedAt?: string;
  status: SyncStatus;      // PENDING_SYNC, SYNCED, FAILED
  syncedAt?: string;
}

export interface NetworkState {
  connected: boolean;
  connectionType: string;
}
