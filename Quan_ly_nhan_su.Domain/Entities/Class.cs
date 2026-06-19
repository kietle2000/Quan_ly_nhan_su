using System;
using System.Collections.Generic;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class Class
    {
        public Guid Id { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string SubjectType { get; set; } = string.Empty;
        
        public Guid InstructorId { get; set; }
        public Employee? Instructor { get; set; }

        public DateTime StartDate { get; set; }
        public int DurationInWeeks { get; set; }

        public ICollection<ClassSchedule> Schedules { get; set; } = new List<ClassSchedule>();
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
