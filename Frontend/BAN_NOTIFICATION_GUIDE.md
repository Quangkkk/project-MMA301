# Hệ thống Thông báo Ban (Cấm user)

## Tổng quan
Khi admin cấm user (ban comment/report), user sẽ nhận được thông báo modal popup chi tiết về việc bị cấm.

## Cách hoạt động

### Backend
1. **Endpoint mới**: `GET /api/users/bans/my-active`
   - Trả về danh sách active bans của user đang đăng nhập
   - Không cần userId trong params (lấy từ token)

2. **Notification được tạo khi admin ban user**
   - Lưu vào bảng Notifications với Type='Ban'
   - SourceID = BanID

### Frontend

#### 1. Component `BanAlertModal`
- Hiển thị modal đẹp mắt với thông tin chi tiết về ban
- Hiển thị: loại ban, lý do, thời gian bắt đầu/kết thúc, admin thực hiện
- Tính toán thời gian còn lại

#### 2. Hook `useBanCheck`
- Tự động check ban status khi app load
- Hiển thị modal nếu có active bans
- Cung cấp `recheckBanStatus()` để check lại khi cần

#### 3. Sử dụng trong component

```tsx
import BanAlertModal from '../components/BanAlertModal';
import { useBanCheck } from '../hooks/useBanCheck';

export default function YourScreen() {
  const { banStatus, showBanModal, closeBanModal, recheckBanStatus } = useBanCheck();
  
  // ... code khác
  
  return (
    <View>
      {/* Nội dung component */}
      
      {/* Thêm modal */}
      <BanAlertModal
        visible={showBanModal}
        bans={banStatus?.activeBans || []}
        onClose={closeBanModal}
      />
    </View>
  );
}
```

## Tích hợp vào các screen khác

### CreatePostScreen
```tsx
const { banStatus, recheckBanStatus } = useBanCheck();

const handleCreatePost = async () => {
  // Check nếu bị ban post
  if (banStatus && !banStatus.canPost) {
    Alert.alert('Không thể đăng bài', 'Bạn đã bị cấm đăng bài');
    await recheckBanStatus(); // Hiện modal chi tiết
    return;
  }
  
  // Tiếp tục tạo post...
};
```

### CommentScreen
```tsx
const { banStatus, recheckBanStatus } = useBanCheck();

const handleAddComment = async () => {
  // Check nếu bị ban comment
  if (banStatus && !banStatus.canComment) {
    Alert.alert('Không thể bình luận', 'Bạn đã bị cấm bình luận');
    await recheckBanStatus(); // Hiện modal chi tiết
    return;
  }
  
  // Tiếp tục add comment...
};
```

### ReportScreen
```tsx
const { banStatus, recheckBanStatus } = useBanCheck();

const handleReport = async () => {
  // Check nếu bị ban report
  if (banStatus && !banStatus.canReport) {
    Alert.alert('Không thể báo cáo', 'Bạn đã bị cấm báo cáo vi phạm');
    await recheckBanStatus(); // Hiện modal chi tiết
    return;
  }
  
  // Tiếp tục report...
};
```

## Xử lý lỗi 403 từ API

Khi user bị ban thử thực hiện action, API trả về 403. Bạn có thể bắt lỗi này và hiện modal:

```tsx
const { recheckBanStatus } = useBanCheck();

try {
  await commentService.addComment(/* ... */);
} catch (error: any) {
  if (error.response?.status === 403) {
    // User bị ban, recheck để hiện modal
    await recheckBanStatus();
  } else {
    Alert.alert('Lỗi', error.message);
  }
}
```

## Tùy chỉnh

### Thay đổi thời gian polling (optional)
Trong `useBanCheck.ts`, uncomment dòng này để check ban định kỳ:

```tsx
// Check mỗi 1 phút
const interval = setInterval(checkBanStatus, 60000);
return () => clearInterval(interval);
```

### Tùy chỉnh UI
Chỉnh sửa styles trong `BanAlertModal.tsx` để phù hợp với design của bạn.

## API Response Format

```json
{
  "success": true,
  "data": {
    "canPost": false,
    "canComment": false,
    "canReport": true,
    "isFullyBanned": false,
    "activeBans": [
      {
        "BanID": 1,
        "BanType": "COMMENT",
        "BanReason": "Spam bình luận",
        "StartDate": "2024-02-01T10:00:00.000Z",
        "EndDate": "2024-02-08T10:00:00.000Z",
        "AdminName": "Admin"
      }
    ]
  }
}
```

## Notes
- Modal chỉ hiện 1 lần khi app load (hasChecked flag)
- Có thể gọi `recheckBanStatus()` để force show modal lại
- Hỗ trợ multiple bans cùng lúc (hiển thị tất cả trong 1 modal)
