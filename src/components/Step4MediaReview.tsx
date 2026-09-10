import React, { useRef } from 'react';
import { Camera as CameraIcon, Trash2, CheckCircle2, CloudAlert, Star } from 'lucide-react';
import { takePhoto, fileToDataUrl } from '../services/camera';
import type { NetworkState, SurveyFormData } from '../types/survey';

interface Step4MediaReviewProps {
  data: SurveyFormData;
  network: NetworkState;
  onChange: (fields: Partial<SurveyFormData>) => void;
}

export const Step4MediaReview: React.FC<Step4MediaReviewProps> = ({
  data,
  network,
  onChange,
}) => {
  // Fallback ref cho Web browser (khi Capacitor Camera không khả dụng)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureNative = async () => {
    const photoUrl = await takePhoto();
    if (photoUrl) {
      // Native: Capacitor Camera thành công
      onChange({ photoBase64: photoUrl });
    } else {
      // Web fallback: trigger file input ẩn
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToDataUrl(file);
        onChange({ photoBase64: base64 });
      } catch (err) {
        console.error('Failed to read photo file:', err);
      }
    }
  };

  const handleRemovePhoto = () => {
    onChange({ photoBase64: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="form-content">
      <div>
        <h2 className="section-title">Minh chứng & Xác nhận</h2>
        <p className="section-subtitle">Chụp ảnh hiện trường hư hỏng và kiểm tra lại thông tin</p>
      </div>

      {/* Hidden input: Web browser fallback - không có capture để chạy trên desktop */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Khu vực Chụp / Xem trước ảnh */}
      {data.photoBase64 ? (
        <div className="photo-preview-container">
          <img
            src={data.photoBase64}
            alt="Hiện trường khảo sát"
            className="photo-preview-img"
          />
          <button
            type="button"
            className="photo-remove-btn"
            onClick={handleRemovePhoto}
            title="Xóa ảnh và chụp lại"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div
          className="photo-capture-box"
          onClick={handleCaptureNative}
          style={{ cursor: 'pointer' }}
        >
          <div className="category-icon-wrapper" style={{ width: 56, height: 56 }}>
            <CameraIcon size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
              Thêm ảnh hiện trường
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
              Bấm để chụp hoặc chọn ảnh từ thiết bị
            </p>
          </div>
        </div>
      )}

      {/* Tóm tắt phiếu khảo sát (Summary Review Card) */}
      <div className="summary-card">
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
          Tóm tắt thông tin kiểm định
        </h4>

        <div className="summary-row">
          <span className="summary-label">Vị trí:</span>
          <span className="summary-value">
            {data.building ? data.building.split('-')[0].trim() : ''} - {data.floor} - Phòng {data.room}
          </span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Phân loại:</span>
          <span className="summary-value">{data.category || 'Chưa chọn'}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Đánh giá:</span>
          <span className="summary-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{data.rating} / 5</span>
            <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
          </span>
        </div>

        <div className="summary-row" style={{ alignItems: 'flex-start' }}>
          <span className="summary-label">Ghi chú lỗi:</span>
          <span className="summary-value" style={{ maxWidth: '65%', textAlign: 'right', wordBreak: 'break-word' }}>
            {data.defectNotes || 'Không có ghi chú'}
          </span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Ảnh minh chứng:</span>
          <span className="summary-value" style={{ color: data.photoBase64 ? 'var(--success)' : 'var(--danger)' }}>
            {data.photoBase64 ? '✓ Đã chụp ảnh' : '✕ Chưa đính kèm ảnh'}
          </span>
        </div>
      </div>

      {/* Thông báo trạng thái mạng khi nộp */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius)',
          backgroundColor: network.connected ? 'var(--success-bg)' : 'var(--warning-bg)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          fontSize: '12px',
        }}
      >
        {network.connected ? (
          <>
            <CheckCircle2 size={20} color="var(--success)" style={{ flexShrink: 0 }} />
            <span style={{ color: 'var(--text-main)' }}>
              Đang <strong>Trực tuyến (Online)</strong>. Phiếu khảo sát sẽ được đồng bộ ngay lên hệ thống.
            </span>
          </>
        ) : (
          <>
            <CloudAlert size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
            <span style={{ color: 'var(--text-main)' }}>
              Đang <strong>Ngoại tuyến (Offline)</strong>. Phiếu khảo sát sẽ được lưu vào <strong>Hàng đợi IndexedDB</strong> và tự động đồng bộ khi có mạng.
            </span>
          </>
        )}
      </div>
    </div>
  );
};
