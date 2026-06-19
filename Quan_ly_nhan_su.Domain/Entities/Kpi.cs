using System;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class Kpi
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public string TargetName { get; set; } = string.Empty; // Tên chỉ tiêu (doanh số, số lead,...)
        public double TargetValue { get; set; }                 // Mục tiêu cần đạt
        public double CurrentValue { get; set; }                // Giá trị thực tế đạt được
        public string Unit { get; set; } = "VNĐ";               // Đơn vị đo lường: VNĐ, Leads, Học sinh
        
        public KpiPeriod Period { get; set; } = KpiPeriod.Monthly;

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        
        public string Status { get; set; } = "InProgress"; // InProgress, Achieved, Failed
    }
}
