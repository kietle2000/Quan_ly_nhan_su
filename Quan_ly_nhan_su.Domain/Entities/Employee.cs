using System;
using System.Collections.Generic;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class Employee
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Employee;
        
        public Guid? DepartmentId { get; set; }
        public Department? Department { get; set; }

        public Guid? PositionId { get; set; }
        public Position? Position { get; set; }

        public bool IsActive { get; set; } = true;
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
        public ICollection<WeeklyWorkPlan> WeeklyWorkPlans { get; set; } = new List<WeeklyWorkPlan>();
        public ICollection<DailyReport> DailyReports { get; set; } = new List<DailyReport>();
        public ICollection<WeeklyReport> WeeklyReports { get; set; } = new List<WeeklyReport>();
        public ICollection<Lead> ManagedLeads { get; set; } = new List<Lead>();
        public ICollection<LeadActivityLog> LeadActivityLogs { get; set; } = new List<LeadActivityLog>();
        public ICollection<Kpi> Kpis { get; set; } = new List<Kpi>();
    }
}
