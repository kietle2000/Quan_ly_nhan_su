using System;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class LeadActivityLog
    {
        public Guid Id { get; set; }
        public Guid LeadId { get; set; }
        public Lead? Lead { get; set; }

        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public string Content { get; set; } = string.Empty; // Nội dung chăm sóc
        public DateTime ActivityDate { get; set; } = DateTime.UtcNow;
        public DateTime? NextFollowUpDate { get; set; }      // Hẹn gọi lại lần sau
    }
}
