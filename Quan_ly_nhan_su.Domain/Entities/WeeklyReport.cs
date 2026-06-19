using System;
using System.Collections.Generic;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class WeeklyReport
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public int WeekNumber { get; set; }
        public int Year { get; set; }
        public string Content { get; set; } = string.Empty;     // Tóm tắt kết quả trong tuần
        public string NextWeekPlan { get; set; } = string.Empty; // Dự kiến kế hoạch tuần tới
        public string? FailureReasonAnalysis { get; set; }
        public string? AdminFeedback { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ReportAttachment> Attachments { get; set; } = new List<ReportAttachment>();
    }
}
