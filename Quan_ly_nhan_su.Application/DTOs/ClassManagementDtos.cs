using System;
using System.Collections.Generic;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Application.DTOs
{
    public class ClassDto
    {
        public Guid Id { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string SubjectType { get; set; } = string.Empty;
        public Guid InstructorId { get; set; }
        public string InstructorName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public int DurationInWeeks { get; set; }
        public List<ClassScheduleDto> Schedules { get; set; } = new();
        public List<EnrollmentDto> Enrollments { get; set; } = new();
    }

    public class ClassScheduleDto
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }

    public class EnrollmentDto
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public TuitionStatus TuitionStatus { get; set; }
        public string TuitionStatusText => TuitionStatus.ToString();
        public string? LearningGoal { get; set; }
        public string? Notes { get; set; }
    }

    public class StudentDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public Guid? LeadId { get; set; }
    }

    public class CreateClassDto
    {
        public string ClassName { get; set; } = string.Empty;
        public string SubjectType { get; set; } = string.Empty;
        public Guid InstructorId { get; set; }
        public DateTime StartDate { get; set; }
        public int DurationInWeeks { get; set; }
        public List<CreateClassScheduleDto>? Schedules { get; set; }
    }

    public class CreateClassScheduleDto
    {
        public DayOfWeek DayOfWeek { get; set; }
        public string StartTime { get; set; } = string.Empty; // "hh:mm"
        public string EndTime { get; set; } = string.Empty; // "hh:mm"
    }

    public class CreateEnrollmentDto
    {
        public Guid StudentId { get; set; }
        public TuitionStatus TuitionStatus { get; set; }
        public string? LearningGoal { get; set; }
        public string? Notes { get; set; }
    }
}
