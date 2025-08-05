/**
 * メンテナンスモードの状態を管理するユーティリティ
 */

import maintenanceConfig from '@/config/maintenance.json';
import type { MaintenanceConfig } from '@/types/maintenance';

// 型安全性のためのアサーション
const config = maintenanceConfig as MaintenanceConfig;

/**
 * メンテナンスモードが有効かどうかを判定する
 * @returns メンテナンスモードが有効の場合true
 */
export const isMaintenanceMode = (): boolean => {
  return config.isMaintenanceMode;
};

/**
 * メンテナンスメッセージを取得する
 * @returns 環境変数で設定されたメッセージ、または デフォルトメッセージ
 */
export const getMaintenanceMessage = (): string => {
  return (
    config.message || 'システムメンテナンス中です。しばらくお待ちください。'
  );
};

/**
 * メンテナンス終了予定時刻を取得する
 * @returns 環境変数で設定された終了時刻、または null
 */
export const getMaintenanceEndTime = (): string | null => {
  return config.endTime || null;
};

export const getAllowedPaths = (): string[] => {
  return config.allowedPaths || ['/'];
};
