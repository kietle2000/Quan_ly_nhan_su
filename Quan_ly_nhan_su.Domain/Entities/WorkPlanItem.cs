using System;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class WorkPlanItem
    {
        public Guid Id { get; set; }
        public Guid WeeklyWorkPlanId { get; set; }
        public WeeklyWorkPlan? WeeklyWorkPlan { get; set; }

        public string TaskName { get; set; } = string.Empty;   // Đầu việc
        public string ActionPlan { get; set; } = string.Empty; // Cách làm
        
        public Guid? SupporterId { get; set; }                  // Người hỗ trợ
        public Employee? Supporter { get; set; }

        public DateTime Deadline { get; set; }
        public string Kpi { get; set; } = string.Empty;         // Chỉ số KPI / kết quả cần đạt
        public WorkItemStatus Status { get; set; } = WorkItemStatus.Pending;
        public string? Notes { get; set; }
    }
}
