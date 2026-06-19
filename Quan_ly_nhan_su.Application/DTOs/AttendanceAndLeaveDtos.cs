using System;

namespace Quan_ly_nhan_su.Application.DTOs
{
    public class AttendanceDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public double WorkHours { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class LeaveRequestDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string? DepartmentName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string LeaveType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Pending, Approved, Rejected
        public Guid? ApprovedById { get; set; }
        public string? ApprovedByName { get; set; }
        public string? ApprovalNotes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateLeaveRequestDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string LeaveType { get; set; } = "Annual"; // Annual, Sick, Unpaid
    }

    public class ApproveLeaveRequestDto
    {
        public string Status { get; set; } = "Approved"; // Approved or Rejected
        public string? ApprovalNotes { get; set; }
    }
}
