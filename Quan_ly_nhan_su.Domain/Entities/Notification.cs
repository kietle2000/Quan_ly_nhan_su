using System;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class Notification
    {
        public Guid Id { get; set; }
        
        // Người nhận (nếu null là gửi cho toàn bộ nhân viên)
        public Guid? RecipientId { get; set; }
        public Employee? Recipient { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? Link { get; set; } // Liên kết điều hướng khi nhấn vào thông báo
    }
}
