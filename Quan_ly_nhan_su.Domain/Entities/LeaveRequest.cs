using System;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class LeaveRequest
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string LeaveType { get; set; } = "Annual"; // Nghỉ phép năm, Nghỉ ốm, Không lương, v.v.
        
        public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

        public Guid? ApprovedById { get; set; }
        public Employee? ApprovedBy { get; set; }

        public string? ApprovalNotes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
