using System;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Domain.Entities
{
    public class Enrollment
    {
        public Guid Id { get; set; }
        
        public Guid StudentId { get; set; }
        public Student? Student { get; set; }

        public Guid ClassId { get; set; }
        public Class? Class { get; set; }

        public TuitionStatus TuitionStatus { get; set; } = TuitionStatus.Unpaid;
        public string? LearningGoal { get; set; }
        public string? Notes { get; set; }
    }
}
