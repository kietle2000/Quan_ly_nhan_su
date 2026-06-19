using System;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class AuditLog
    {
        public Guid Id { get; set; }
        
        public Guid? EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public string Action { get; set; } = string.Empty;     // Create, Update, Delete, Login, v.v.
        public string TableName { get; set; } = string.Empty;  // Tên bảng bị tác động
        public string RecordId { get; set; } = string.Empty;   // Khóa chính của bản ghi
        public string? OldValues { get; set; }                 // Dữ liệu cũ (JSON)
        public string? NewValues { get; set; }                 // Dữ liệu mới (JSON)
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
