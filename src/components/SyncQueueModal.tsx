import React, { useEffect, useState } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  Clock,
  Trash2,
  Star,
  MapPin,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import { getAllSurveys, deleteSurvey } from '../services/db';
import { syncEngine, GOOGLE_SHEET_VIEW_URL } from '../services/sync';
import type { SurveyRecord } from '../types/survey';

interface SyncQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSurveysChanged?: () => void;
}

type TabType = 'all' | 'pending' | 'synced';

export const SyncQueueModal: React.FC<SyncQueueModalProps> = ({
  isOpen,
  onClose,
  onSurveysChanged,
}) => {
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchSurveys = async () => {
    const list = await getAllSurveys();
    setSurveys(list);
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchSurveys();
    }
  }, [isOpen]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncEngine.syncPending();
    await fetchSurveys();
    setIsSyncing(false);
    if (onSurveysChanged) onSurveysChanged();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi khảo sát này khỏi bộ nhớ máy?')) {
      await deleteSurvey(id);
      await fetchSurveys();
      if (onSurveysChanged) onSurveysChanged();
    }
  };

  if (!isOpen) return null;

  const pendingList = surveys.filter((s) => s.status === 'PENDING_SYNC');
  const syncedList = surveys.filter((s) => s.status === 'SYNCED');

  const displayedList =
    activeTab === 'pending'
      ? pendingList
      : activeTab === 'synced'
      ? syncedList
      : surveys;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
              Phiếu khảo sát đã nộp
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
              Tổng cộng {surveys.length} phiếu ({pendingList.length} chờ đồng bộ)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {pendingList.length > 0 && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Đồng bộ ngay lên Google Sheets"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Đang gửi...' : 'Đồng bộ'}</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 8px' }}
              onClick={onClose}
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Filter */}
        <div className="history-tabs-container">
          <button
            type="button"
            className={`history-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả ({surveys.length})
          </button>
          <button
            type="button"
            className={`history-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Chờ gửi ({pendingList.length})
          </button>
          <button
            type="button"
            className={`history-tab ${activeTab === 'synced' ? 'active' : ''}`}
            onClick={() => setActiveTab('synced')}
          >
            Đã đồng bộ ({syncedList.length})
          </button>
        </div>

        {/* Banner dẫn đến Google Sheets */}
        <div className="sheet-link-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={18} color="#0f9d58" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              Dữ liệu Cloud: Google Sheets
            </span>
          </div>
          <a
            href={GOOGLE_SHEET_VIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="sheet-link-action"
            title="Mở file Google Sheets trên tab mới"
          >
            <span>Mở Bảng tính</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Modal Body: Danh sách phiếu */}
        <div className="modal-body">
          {displayedList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Chưa có phiếu khảo sát nào</p>
              <p style={{ fontSize: '12px', marginTop: 4 }}>
                {activeTab === 'pending'
                  ? 'Hiện không có phiếu nào đang chờ gửi.'
                  : activeTab === 'synced'
                  ? 'Chưa có phiếu nào được đồng bộ thành công.'
                  : 'Hãy hoàn thành một khảo sát và bấm nộp để xem tại đây.'}
              </p>
            </div>
          ) : (
            displayedList.map((item) => {
              const isPending = item.status === 'PENDING_SYNC';

              return (
                <div key={item.id} className="survey-detail-card">
                  {/* Card Header: Phân loại & Trạng thái */}
                  <div className="survey-card-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="survey-category-badge">{item.category}</span>
                      <span className="survey-time">
                        {new Date(item.createdAt).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isPending ? (
                        <span className="status-tag pending">
                          <Clock size={11} />
                          <span>Chờ gửi</span>
                        </span>
                      ) : (
                        <span className="status-tag synced">
                          <CheckCircle2 size={11} />
                          <span>Đã lên Sheets</span>
                        </span>
                      )}

                      <button
                        type="button"
                        className="card-delete-btn"
                        onClick={() => handleDelete(item.id)}
                        title="Xóa phiếu này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Vị trí & Đánh giá */}
                  <div className="survey-card-info-row">
                    <div className="survey-info-item">
                      <MapPin size={13} className="text-primary" />
                      <span>
                        {item.building ? item.building.split('-')[0].trim() : ''} • {item.floor} • Phòng {item.room}
                      </span>
                    </div>

                    <div className="survey-rating-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          fill={s <= item.rating ? '#f59e0b' : 'none'}
                          stroke={s <= item.rating ? '#f59e0b' : 'var(--text-light)'}
                        />
                      ))}
                      <span style={{ fontSize: '11px', fontWeight: 700, marginLeft: 2, color: '#f59e0b' }}>
                        {item.rating}/5
                      </span>
                    </div>
                  </div>

                  {/* Ghi chú lỗi chi tiết */}
                  {item.defectNotes && (
                    <div className="survey-notes-box">
                      <strong>Lỗi:</strong> {item.defectNotes}
                    </div>
                  )}

                  {/* Ảnh minh chứng (nếu có) */}
                  {item.photoBase64 && (
                    <div className="survey-photo-preview-bar">
                      <div
                        className="survey-thumb-wrapper"
                        onClick={() => setSelectedPhoto(item.photoBase64 || null)}
                        title="Bấm để phóng to xem ảnh"
                      >
                        <img
                          src={item.photoBase64}
                          alt="Minh chứng hiện trường"
                          className="survey-thumb-img"
                        />
                        <div className="survey-thumb-overlay">
                          <Eye size={14} color="#ffffff" />
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Ảnh minh chứng đính kèm (Bấm để xem)
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lightbox xem ảnh kích thước lớn */}
      {selectedPhoto && (
        <div className="photo-lightbox-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="photo-lightbox-close"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={20} />
            </button>
            <img src={selectedPhoto} alt="Ảnh phóng to" className="photo-lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
};
