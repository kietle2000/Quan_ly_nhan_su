using System;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class ClassSchedule
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public Class? Class { get; set; }

        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }
}
