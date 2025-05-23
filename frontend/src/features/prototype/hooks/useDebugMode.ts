import { useDebugMode as useDebugModeFromContext } from '../contexts/DebugModeContext';

/**
 * デバッグモードの表示状態を管理するフック
 * @returns デバッグモードの表示状態と切り替え関数
 */
export const useDebugMode = useDebugModeFromContext;
