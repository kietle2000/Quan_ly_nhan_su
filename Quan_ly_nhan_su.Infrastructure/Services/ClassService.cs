using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Quan_ly_nhan_su.Application.DTOs;
using Quan_ly_nhan_su.Application.Interfaces;
using Quan_ly_nhan_su.Domain.Entities;
using Quan_ly_nhan_su.Domain.Enums;
using Quan_ly_nhan_su.Infrastructure.Persistence;

namespace Quan_ly_nhan_su.Infrastructure.Services
{
    public class ClassService : IClassService
    {
        private readonly ApplicationDbContext _context;

        public ClassService(ApplicationDbContext context)
        {
            _context = context;
        }

        // ===== CLASSES =====
        public async Task<IEnumerable<ClassDto>> GetAllClassesAsync()
        {
            var classes = await _context.Classes
                .Include(c => c.Instructor)
                .Include(c => c.Schedules)
                .Include(c => c.Enrollments)
                    .ThenInclude(e => e.Student)
                .OrderByDescending(c => c.StartDate)
                .ToListAsync();

            return classes.Select(MapToClassDto);
        }

        public async Task<ClassDto?> GetClassByIdAsync(Guid id)
        {
            var c = await _context.Classes
                .Include(c => c.Instructor)
                .Include(c => c.Schedules)
                .Include(c => c.Enrollments)
                    .ThenInclude(e => e.Student)
                .FirstOrDefaultAsync(c => c.Id == id);

            return c == null ? null : MapToClassDto(c);
        }

        public async Task<IEnumerable<ClassDto>> GetClassesByInstructorAsync(Guid instructorId)
        {
            var classes = await _context.Classes
                .Where(c => c.InstructorId == instructorId)
                .Include(c => c.Instructor)
                .Include(c => c.Schedules)
                .Include(c => c.Enrollments)
                    .ThenInclude(e => e.Student)
                .OrderByDescending(c => c.StartDate)
                .ToListAsync();

            return classes.Select(MapToClassDto);
        }

        public async Task<ClassDto> CreateClassAsync(CreateClassDto dto)
        {
            var instructor = await _context.Employees.FindAsync(dto.InstructorId)
                ?? throw new Exception("Không tìm thấy giảng viên.");

            if (instructor.Role != UserRole.Instructor && instructor.Role != UserRole.Admin)
                throw new Exception("Người được chọn không có Role 'Instructor'.");

            var newClass = new Class
            {
                Id = Guid.NewGuid(),
                ClassName = dto.ClassName,
                SubjectType = dto.SubjectType,
                InstructorId = dto.InstructorId,
                StartDate = dto.StartDate,
                DurationInWeeks = dto.DurationInWeeks
            };

            if (dto.Schedules != null && dto.Schedules.Any())
            {
                newClass.Schedules = dto.Schedules.Select(s => new ClassSchedule
                {
                    Id = Guid.NewGuid(),
                    ClassId = newClass.Id,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = TimeSpan.Parse(s.StartTime),
                    EndTime = TimeSpan.Parse(s.EndTime)
                }).ToList();
            }

            _context.Classes.Add(newClass);
            await _context.SaveChangesAsync();

            return (await GetClassByIdAsync(newClass.Id))!;
        }

        public async Task AssignInstructorAsync(Guid classId, Guid instructorId)
        {
            var @class = await _context.Classes.FindAsync(classId)
                ?? throw new Exception("Không tìm thấy lớp học.");

            var instructor = await _context.Employees.FindAsync(instructorId)
                ?? throw new Exception("Không tìm thấy giảng viên.");

            if (instructor.Role != UserRole.Instructor && instructor.Role != UserRole.Admin)
                throw new Exception("Người được chọn không có Role 'Instructor'.");

            @class.InstructorId = instructorId;
            _context.Classes.Update(@class);
            await _context.SaveChangesAsync();
        }

        // ===== ENROLLMENTS =====
        public async Task<EnrollmentDto> EnrollStudentAsync(Guid classId, CreateEnrollmentDto dto)
        {
            var @class = await _context.Classes.FindAsync(classId)
                ?? throw new Exception("Không tìm thấy lớp học.");

            var student = await _context.Students.FindAsync(dto.StudentId)
                ?? throw new Exception("Không tìm thấy học viên.");

            bool alreadyEnrolled = await _context.Enrollments
                .AnyAsync(e => e.ClassId == classId && e.StudentId == dto.StudentId);
            if (alreadyEnrolled)
                throw new Exception("Học viên này đã được thêm vào lớp học rồi.");

            var enrollment = new Enrollment
            {
                Id = Guid.NewGuid(),
                StudentId = dto.StudentId,
                ClassId = classId,
                TuitionStatus = dto.TuitionStatus,
                LearningGoal = dto.LearningGoal,
                Notes = dto.Notes
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return new EnrollmentDto
            {
                Id = enrollment.Id,
                StudentId = student.Id,
                StudentName = student.FullName,
                ClassId = @class.Id,
                ClassName = @class.ClassName,
                TuitionStatus = enrollment.TuitionStatus,
                LearningGoal = enrollment.LearningGoal,
                Notes = enrollment.Notes
            };
        }

        public async Task<IEnumerable<EnrollmentDto>> GetTuitionAlertsAsync()
        {
            var unpaid = await _context.Enrollments
                .Where(e => e.TuitionStatus == TuitionStatus.Unpaid || e.TuitionStatus == TuitionStatus.Partial)
                .Include(e => e.Student)
                .Include(e => e.Class)
                .ToListAsync();

            return unpaid.Select(e => new EnrollmentDto
            {
                Id = e.Id,
                StudentId = e.StudentId,
                StudentName = e.Student?.FullName ?? string.Empty,
                ClassId = e.ClassId,
                ClassName = e.Class?.ClassName ?? string.Empty,
                TuitionStatus = e.TuitionStatus,
                LearningGoal = e.LearningGoal,
                Notes = e.Notes
            });
        }

        // ===== STUDENTS =====
        public async Task<IEnumerable<StudentDto>> GetAllStudentsAsync()
        {
            var students = await _context.Students.OrderBy(s => s.FullName).ToListAsync();
            return students.Select(s => new StudentDto
            {
                Id = s.Id,
                FullName = s.FullName,
                Phone = s.Phone,
                Email = s.Email,
                LeadId = s.LeadId
            });
        }

        public async Task<StudentDto> CreateStudentAsync(StudentDto dto)
        {
            var student = new Student
            {
                Id = Guid.NewGuid(),
                FullName = dto.FullName,
                Phone = dto.Phone,
                Email = dto.Email,
                LeadId = dto.LeadId
            };
            _context.Students.Add(student);
            await _context.SaveChangesAsync();
            dto.Id = student.Id;
            return dto;
        }

        // ===== MAPPING =====
        private static ClassDto MapToClassDto(Class c) => new ClassDto
        {
            Id = c.Id,
            ClassName = c.ClassName,
            SubjectType = c.SubjectType,
            InstructorId = c.InstructorId,
            InstructorName = c.Instructor?.FullName ?? string.Empty,
            StartDate = c.StartDate,
            DurationInWeeks = c.DurationInWeeks,
            Schedules = c.Schedules.Select(s => new ClassScheduleDto
            {
                Id = s.Id,
                ClassId = s.ClassId,
                DayOfWeek = s.DayOfWeek,
                StartTime = s.StartTime,
                EndTime = s.EndTime
            }).ToList(),
            Enrollments = c.Enrollments.Select(e => new EnrollmentDto
            {
                Id = e.Id,
                StudentId = e.StudentId,
                StudentName = e.Student?.FullName ?? string.Empty,
                ClassId = e.ClassId,
                ClassName = c.ClassName,
                TuitionStatus = e.TuitionStatus,
                LearningGoal = e.LearningGoal,
                Notes = e.Notes
            }).ToList()
        };
    }
}
