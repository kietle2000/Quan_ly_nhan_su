using System;
using System.Collections.Generic;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class DailyReport
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public DateTime Date { get; set; }
        public string Content { get; set; } = string.Empty; // Nội dung đã làm
        public double ProgressPercentage { get; set; }       // Tỷ lệ hoàn thành công việc (%)

        // Báo cáo Chỉ số Phễu (KPI / Thực tế / Đánh giá) theo Ngày
        public int TargetNew { get; set; }
        public int TargetContacted { get; set; }
        public int TargetConsulting { get; set; }
        public int TargetMeeting { get; set; }
        public int TargetSigned { get; set; }

        public string? EvalNew { get; set; }
        public string? EvalContacted { get; set; }
        public string? EvalConsulting { get; set; }
        public string? EvalMeeting { get; set; }
        public string? EvalSigned { get; set; }

        public string? FailureReasonAnalysis { get; set; }
        public string? AdminFeedback { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ReportAttachment> Attachments { get; set; } = new List<ReportAttachment>();
    }
}
