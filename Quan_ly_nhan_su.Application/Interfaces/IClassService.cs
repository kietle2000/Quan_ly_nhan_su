using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Quan_ly_nhan_su.Application.DTOs;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Application.Interfaces
{
    public interface IClassService
    {
        Task<IEnumerable<ClassDto>> GetAllClassesAsync();
        Task<ClassDto?> GetClassByIdAsync(Guid id);
        Task<IEnumerable<ClassDto>> GetClassesByInstructorAsync(Guid instructorId);
        Task<ClassDto> CreateClassAsync(CreateClassDto dto);
        Task AssignInstructorAsync(Guid classId, Guid instructorId);
        Task<EnrollmentDto> EnrollStudentAsync(Guid classId, CreateEnrollmentDto dto);
        Task<IEnumerable<EnrollmentDto>> GetTuitionAlertsAsync();

        // Student
        Task<IEnumerable<StudentDto>> GetAllStudentsAsync();
        Task<StudentDto> CreateStudentAsync(StudentDto dto);
    }
}
