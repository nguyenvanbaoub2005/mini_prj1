import React, { useState } from 'react';
import { MapPin, Building2, Layers, Navigation } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import type { SurveyFormData } from '../types/survey';
interface Step1LocationProps {
  data: SurveyFormData;
  onChange: (fields: Partial<SurveyFormData>) => void;
}

const BUILDINGS = [
  'Khu V - Tòa nhà Trung tâm & Hội trường',
  'Khu A - Tòa Hành chính & Phòng học',
  'Khu B - Giảng đường thực hành & Lab Máy tính',
  'Khu C - Viện Nghiên cứu & Đổi mới sáng tạo',
  'Khu KTX - Ký túc xá sinh viên',
  'Thư viện số & Khu tự học',
];

const FLOORS = [
  'Tầng hầm (Basement)',
  'Tầng 1',
  'Tầng 2',
  'Tầng 3',
  'Tầng 4',
  'Tầng 5',
  'Tầng 6',
];

export const Step1Location: React.FC<Step1LocationProps> = ({ data, onChange }) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      onChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (err) {
      console.error('Lỗi lấy tọa độ:', err);
      alert('Không thể lấy tọa độ GPS. Hãy kiểm tra quyền truy cập vị trí.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="form-content">
      <div>
        <h2 className="section-title">Vị trí khảo sát</h2>
        <p className="section-subtitle">Xác định địa điểm cơ sở vật chất cần thanh tra</p>
      </div>

      {/* Chọn Tòa nhà */}
      <div className="form-group">
        <label className="form-label">
          <Building2 size={16} className="text-primary" />
          <span>Tòa nhà / Khu vực</span>
          <span className="required">*</span>
        </label>
        <select
          className="form-select"
          value={data.building}
          onChange={(e) => onChange({ building: e.target.value })}
        >
          <option value="">-- Chọn tòa nhà tại cơ sở VKU --</option>
          {BUILDINGS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Chọn Tầng */}
      <div className="form-group">
        <label className="form-label">
          <Layers size={16} className="text-primary" />
          <span>Tầng / Khu vực độ cao</span>
          <span className="required">*</span>
        </label>
        <select
          className="form-select"
          value={data.floor}
          onChange={(e) => onChange({ floor: e.target.value })}
        >
          <option value="">-- Chọn tầng --</option>
          {FLOORS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Nhập Số Phòng */}
      <div className="form-group">
        <label className="form-label">
          <MapPin size={16} className="text-primary" />
          <span>Số phòng / Vị trí cụ thể</span>
          <span className="required">*</span>
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="Ví dụ: V.302, Lab 4.1, Phòng Hội thảo 1..."
          value={data.room}
          onChange={(e) => onChange({ room: e.target.value })}
        />
      </div>

      {/* Gợi ý nhanh phòng học phổ biến */}
      <div style={{ marginTop: '6px' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Gợi ý nhanh:
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['V.201', 'V.305', 'A.102', 'Lab 203', 'Hội trường C'].map((preset) => (
            <button
              key={preset}
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px' }}
              onClick={() => onChange({ room: preset })}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Lấy tọa độ GPS (Capacitor Geolocation) */}
      <div className="form-group" style={{ marginTop: '16px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleGetLocation}
          disabled={isLocating}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Navigation size={16} />
          <span>{isLocating ? 'Đang lấy tọa độ...' : 'Lấy tọa độ GPS hiện tại'}</span>
        </button>
        {data.latitude && data.longitude && (
          <p style={{ fontSize: '12px', color: 'var(--success)', marginTop: '8px', textAlign: 'center' }}>
            ✓ Đã lưu tọa độ: {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
};
