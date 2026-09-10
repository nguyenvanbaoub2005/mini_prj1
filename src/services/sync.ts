import { getPendingSurveys, updateSurveyStatus } from './db';
import { networkService } from './network';
import { notifySyncSuccess } from './notifications';
import type { SurveyRecord } from '../types/survey';

export type SyncEventCallback = (isSyncing: boolean, pendingCount: number) => void;

// Webhook Google Apps Script của bạn
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzTsqwJYEGwNIhnsrfu_LbUp9ECWQ6aweQxJKt-6peJPtZE2dRkF2S4X-4yTv1_Bc2i/exec';

// Link xem bảng tính Google Sheets trực tiếp
export const GOOGLE_SHEET_VIEW_URL = 'https://docs.google.com/spreadsheets/d/1ry-4NJ-sXtrmQSzBmQkWriJqnWI_A1FnuIRDY96tp5A/edit?usp=sharing';

class SyncEngine {
  private isSyncing = false;
  private listeners: SyncEventCallback[] = [];

  constructor() {
    // Tự động kích hoạt đồng bộ khi có mạng trở lại
    networkService.subscribe((state) => {
      if (state.connected) {
        this.syncPending();
      }
    });
  }

  subscribe(callback: SyncEventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(isSyncing: boolean, count: number) {
    for (const listener of this.listeners) {
      try {
        listener(isSyncing, count);
      } catch (e) {
        console.error('Error notifying sync listener:', e);
      }
    }
  }

  /**
   * Gửi phiếu khảo sát trực tiếp lên Google Sheets qua Apps Script Webhook
   */
  private async dispatchSurveyToServer(survey: SurveyRecord): Promise<boolean> {
    try {
      console.log(`[SyncEngine] 🚀 Đang gửi dữ liệu phiếu ${survey.id} lên Google Sheets...`);
      
      await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors', // Chống lỗi chặn CORS của Google Apps Script khi gọi từ trình duyệt
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(survey),
      });

      console.log(`[SyncEngine] ✅ Đã đẩy thành công phiếu ${survey.id} vào Google Sheets!`);
      return true;
    } catch (err) {
      console.error(`[SyncEngine] ❌ Lỗi khi gửi phiếu ${survey.id} lên Google Sheets:`, err);
      return false;
    }
  }

  /**
   * Đồng bộ tuần tự các bản ghi đang ở trạng thái PENDING_SYNC
   */
  async syncPending(): Promise<{ total: number; success: number }> {
    if (this.isSyncing) return { total: 0, success: 0 };
    if (!networkService.getCurrentState().connected) {
      return { total: 0, success: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;

    try {
      const pendingList = await getPendingSurveys();
      this.notify(true, pendingList.length);

      for (const survey of pendingList) {
        try {
          const ok = await this.dispatchSurveyToServer(survey);
          if (ok) {
            await updateSurveyStatus(survey.id, 'SYNCED', new Date().toISOString());
            notifySyncSuccess(survey.id);
            successCount++;
          } else {
            await updateSurveyStatus(survey.id, 'FAILED');
          }
        } catch (err) {
          console.error(`[SyncEngine] Failed to sync survey ${survey.id}:`, err);
          await updateSurveyStatus(survey.id, 'FAILED');
        }
      }
    } finally {
      this.isSyncing = false;
      const remaining = await getPendingSurveys();
      this.notify(false, remaining.length);
    }

    return { total: pendingList.length, success: successCount };
  }
}

export const syncEngine = new SyncEngine();
