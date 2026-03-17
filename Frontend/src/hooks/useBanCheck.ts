import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '../services/userService';

interface BanInfo {
  BanID: number;
  BanType: string;
  BanReason: string;
  StartDate: string;
  EndDate: string | null;
  AdminName: string;
}

interface BanStatus {
  canPost: boolean;
  canComment: boolean;
  canReport: boolean;
  isFullyBanned: boolean;
  activeBans: BanInfo[];
}

export const useBanCheck = () => {
  const [banStatus, setBanStatus] = useState<BanStatus | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);

  const checkBanStatus = useCallback(async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.log('[BanCheck] No token in AsyncStorage');
      return;
    }

    try {
      const status = await userService.getMyActiveBans(token);
      setBanStatus(status);
      // Không tự động hiện modal - chỉ lưu ban status
      // Modal chỉ hiện khi user thực hiện hành động bị cấm (qua recheckBanStatus)
    } catch (error) {
      console.error('Error checking ban status:', error);
    }
  }, []);

  useEffect(() => {
    // Check ban khi component mount
    checkBanStatus();

    // Có thể setup polling để check định kỳ (optional)
    // const interval = setInterval(checkBanStatus, 60000); // Check mỗi 1 phút
    // return () => clearInterval(interval);
  }, [checkBanStatus]);

  const closeBanModal = () => {
    setShowBanModal(false);
  };

  // Function để re-check ban status (gọi khi user thử thực hiện action bị chặn)
  const recheckBanStatus = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.log('[BanCheck] No token in AsyncStorage, skipping recheck');
      return;
    }
    
    try {
      console.log('[BanCheck] Rechecking ban status...');
      const status = await userService.getMyActiveBans(token);
      console.log('[BanCheck] Ban status received:', status);
      setBanStatus(status);
      
      if (status.activeBans && status.activeBans.length > 0) {
        console.log('[BanCheck] Setting showBanModal to TRUE, bans:', status.activeBans);
        setShowBanModal(true);
      } else {
        console.log('[BanCheck] No active bans found');
      }
      
      return status;
    } catch (error) {
      console.error('Error rechecking ban status:', error);
      return null;
    }
  };

  return {
    banStatus,
    showBanModal,
    closeBanModal,
    recheckBanStatus,
  };
};
