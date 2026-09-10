import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Send, Check, CheckCircle2, CloudAlert, X } from 'lucide-react';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { Step1Location } from './components/Step1Location';
import { Step2Category } from './components/Step2Category';
import { Step3Condition } from './components/Step3Condition';
import { Step4MediaReview } from './components/Step4MediaReview';
import { SyncQueueModal } from './components/SyncQueueModal';

import {
  saveDraft,
  loadDraft,
  clearDraft,
  saveSurvey,
  getAllSurveys,
} from './services/db';
import { networkService } from './services/network';
import { syncEngine } from './services/sync';
import { registerPushNotifications } from './services/notifications';
import type { SurveyFormData, SurveyRecord, NetworkState } from './types/survey';

interface ToastState {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

const INITIAL_FORM_DATA: SurveyFormData = {
  building: '',
  floor: '',
  room: '',
  category: '',
  rating: 0,
  defectNotes: '',
  photoBase64: undefined,
};

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<SurveyFormData>(INITIAL_FORM_DATA);
  const [network, setNetwork] = useState<NetworkState>({
    connected: true,
    connectionType: 'wifi',
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [draftToastVisible, setDraftToastVisible] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const triggerToast = (title: string, message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Cập nhật số lượng phiếu (tổng và pending)
  const refreshCounts = useCallback(async () => {
    const list = await getAllSurveys();
    setTotalCount(list.length);
    const pending = list.filter((s) => s.status === 'PENDING_SYNC');
    setPendingCount(pending.length);
  }, []);

  // 1. Khởi tạo theo dõi mạng và hàng đợi đồng bộ
  useEffect(() => {
    networkService.init().then((state) => setNetwork(state));
    registerPushNotifications();

    const unsubscribeNetwork = networkService.subscribe((state) => {
      setNetwork(state);
    });

    const unsubscribeSync = syncEngine.subscribe((syncing, count) => {
      setIsSyncing(syncing);
      setPendingCount(count);
      void refreshCounts();
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCounts();

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
    };
  }, [refreshCounts]);

  // 2. Khôi phục bản nháp từ IndexedDB khi mở ứng dụng (F5 không mất dữ liệu)
  useEffect(() => {
    loadDraft().then((saved) => {
      if (saved && saved.data) {
        setFormData(saved.data);
        if (saved.step >= 1 && saved.step <= 4) {
          setCurrentStep(saved.step);
        }
      }
    });
  }, []);

  // 3. Tự động lưu bản nháp vào IndexedDB theo thời gian thực (Real-time Persistence)
  const persistDraft = useCallback(async (data: SurveyFormData, step: number) => {
    const hasData =
      data.building ||
      data.floor ||
      data.room ||
      data.category ||
      data.rating > 0 ||
      data.defectNotes ||
      data.photoBase64;

    if (hasData) {
      await saveDraft(data, step);
      setDraftToastVisible(true);
      const timer = setTimeout(() => setDraftToastVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleUpdateForm = (fields: Partial<SurveyFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...fields };
      persistDraft(next, currentStep);
      return next;
    });
  };

  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    persistDraft(formData, newStep);
  };

  // 4. Kiểm tra hợp lệ dữ liệu của từng bước (Validation)
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return Boolean(formData.building && formData.floor && formData.room.trim());
      case 2:
        return Boolean(formData.category);
      case 3:
        return Boolean(formData.rating > 0 && formData.defectNotes.trim());
      case 4:
        return true;
      default:
        return false;
    }
  };

  // 5. Xử lý nộp phiếu khảo sát (Submit Survey)
  const handleSubmitSurvey = async () => {
    const surveyId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `vku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newRecord: SurveyRecord = {
      ...formData,
      id: surveyId,
      createdAt: new Date().toISOString(),
      status: 'PENDING_SYNC',
    };

    // Lưu vào IndexedDB
    await saveSurvey(newRecord);

    // Xóa bản nháp đã nộp thành công
    await clearDraft();
    setFormData(INITIAL_FORM_DATA);
    setCurrentStep(1);

    // Cập nhật số lượng phiếu
    await refreshCounts();

    // Nếu đang có kết nối mạng, kích hoạt đồng bộ tự động ngay
    if (network.connected) {
      syncEngine.syncPending();
      triggerToast(
        'Đã gửi phiếu thành công!',
        'Dữ liệu đang được tự động đồng bộ lên Google Sheets.',
        'success'
      );
    } else {
      triggerToast(
        'Đã lưu vào Hàng đợi Offline!',
        'Thiết bị đang Offline. Phiếu đã được lưu an toàn vào IndexedDB.',
        'warning'
      );
    }
  };

  return (
    <>
      <Header
        network={network}
        pendingCount={pendingCount}
        totalCount={totalCount}
        isSyncing={isSyncing}
        onOpenQueue={() => setIsQueueOpen(true)}
      />

      <StepIndicator
        currentStep={currentStep}
        totalSteps={4}
        onSelectStep={(step) => handleStepChange(step)}
      />

      {/* Nội dung form theo từng bước */}
      {currentStep === 1 && (
        <Step1Location data={formData} onChange={handleUpdateForm} />
      )}
      {currentStep === 2 && (
        <Step2Category data={formData} onChange={handleUpdateForm} />
      )}
      {currentStep === 3 && (
        <Step3Condition data={formData} onChange={handleUpdateForm} />
      )}
      {currentStep === 4 && (
        <Step4MediaReview
          data={formData}
          network={network}
          onChange={handleUpdateForm}
        />
      )}

      {/* Thông báo lưu nháp IndexedDB mượt mà */}
      {draftToastVisible && (
        <div className="draft-toast">
          <Check size={14} color="#10b981" />
          <span>Đã lưu nháp IndexedDB</span>
        </div>
      )}

      {/* Toast Notification Hiện đại */}
      {toast && (
        <div className={`app-toast-container ${toast.type}`}>
          <div className="app-toast-icon">
            {toast.type === 'success' ? (
              <CheckCircle2 size={22} color="#10b981" />
            ) : (
              <CloudAlert size={22} color="#f59e0b" />
            )}
          </div>
          <div className="app-toast-text">
            <h5 className="app-toast-title">{toast.title}</h5>
            <p className="app-toast-desc">{toast.message}</p>
          </div>
          <button
            type="button"
            className="app-toast-close"
            onClick={() => setToast(null)}
            title="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Thanh điều hướng dưới cùng */}
      <footer className="bottom-nav">
        {currentStep > 1 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleStepChange(currentStep - 1)}
          >
            <ChevronLeft size={18} />
            <span>Quay lại</span>
          </button>
        )}

        {currentStep < 4 ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isStepValid(currentStep)}
            onClick={() => handleStepChange(currentStep + 1)}
          >
            <span>Tiếp theo</span>
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmitSurvey}
          >
            <Send size={18} />
            <span>{network.connected ? 'Gửi khảo sát' : 'Lưu vào hàng đợi'}</span>
          </button>
        )}
      </footer>

      {/* Modal xem danh sách phiếu đã nộp & chi tiết */}
      <SyncQueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        onSurveysChanged={refreshCounts}
      />
    </>
  );
}
