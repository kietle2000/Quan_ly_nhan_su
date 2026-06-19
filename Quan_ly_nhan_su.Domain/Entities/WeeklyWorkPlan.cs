using System;
using System.Collections.Generic;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class WeeklyWorkPlan
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public int WeekNumber { get; set; }
        public int Year { get; set; }
        public string Target { get; set; } = string.Empty; // Mục tiêu chung của tuần
        public string? Notes { get; set; }

        // Báo cáo Chỉ số Phễu (KPI / Thực tế / Đánh giá)
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

        public ICollection<WorkPlanItem> WorkPlanItems { get; set; } = new List<WorkPlanItem>();
    }
}
