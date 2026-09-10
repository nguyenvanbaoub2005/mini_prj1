import React, { useState } from 'react';
import { MapPin, Building2, Layers, Navigation, CheckCircle2 } from 'lucide-react';
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
  const [address, setAddress] = useState<string | null>(null);

  const handleGetLocation = async () => {
    setIsLocating(true);
    setAddress(null);
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      const { latitude, longitude } = position.coords;
      onChange({ latitude, longitude });

      // Reverse geocoding với BigDataCloud (miễn phí, không cần API key, không bị CORS)
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=vi`
        );
        const geo = await res.json();
        // Ghép địa chỉ từ các field trả về
        const parts = [
          geo.locality || geo.city,
          geo.principalSubdivision,
          geo.countryName,
        ].filter(Boolean);
        setAddress(parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      } catch {
        setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
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
          className={`btn ${data.latitude ? 'btn-secondary' : 'btn-primary'}`}
          onClick={handleGetLocation}
          disabled={isLocating}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Navigation size={16} />
          <span>{isLocating ? 'Đang lấy vị trí...' : data.latitude ? 'Cập nhật vị trí GPS' : 'Lấy vị trí GPS hiện tại'}</span>
        </button>
        {address && (
          <div style={{
            marginTop: '10px',
            padding: '10px 12px',
            background: 'var(--success-bg)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>Đã xác định vị trí</p>
              <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: 2 }}>{address}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
