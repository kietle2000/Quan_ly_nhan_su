using System;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class Attendance
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public DateTime Date { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public double WorkHours { get; set; } // Tổng số giờ làm việc
        
        // Trạng thái: Present, Late, Absent, EarlyLeave, v.v.
        public string Status { get; set; } = "Absent"; 
    }
}
