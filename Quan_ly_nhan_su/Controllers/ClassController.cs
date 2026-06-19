using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Quan_ly_nhan_su.Application.DTOs;
using Quan_ly_nhan_su.Application.Interfaces;

namespace Quan_ly_nhan_su.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/class")]
    public class ClassController : ControllerBase
    {
        private readonly IClassService _classService;

        public ClassController(IClassService classService)
        {
            _classService = classService;
        }

        // GET /api/class — Lấy tất cả lớp học
        [HttpGet]
        public async Task<IActionResult> GetAllClasses()
        {
            var classes = await _classService.GetAllClassesAsync();
            return Ok(classes);
        }

        // GET /api/class/{id} — Lấy chi tiết 1 lớp học
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetClassById(Guid id)
        {
            var c = await _classService.GetClassByIdAsync(id);
            if (c == null) return NotFound("Không tìm thấy lớp học.");
            return Ok(c);
        }

        // GET /api/class/instructor/{instructorId} — Lấy lớp học theo giảng viên
        [HttpGet("instructor/{instructorId:guid}")]
        public async Task<IActionResult> GetClassesByInstructor(Guid instructorId)
        {
            var classes = await _classService.GetClassesByInstructorAsync(instructorId);
            return Ok(classes);
        }

        // POST /api/class — Tạo lớp học mới
        [Authorize(Roles = "Admin,Manager")]
        [HttpPost]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto)
        {
            try
            {
                var result = await _classService.CreateClassAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // PUT /api/class/{id}/assign-instructor — Gán Giảng viên cho lớp
        [Authorize(Roles = "Admin,Manager")]
        [HttpPut("{id:guid}/assign-instructor")]
        public async Task<IActionResult> AssignInstructor(Guid id, [FromBody] AssignInstructorDto dto)
        {
            try
            {
                await _classService.AssignInstructorAsync(id, dto.InstructorId);
                return Ok(new { message = "Gán giảng viên thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST /api/class/{id}/enroll — Thêm học viên vào lớp
        [Authorize(Roles = "Admin,Manager,Instructor")]
        [HttpPost("{id:guid}/enroll")]
        public async Task<IActionResult> EnrollStudent(Guid id, [FromBody] CreateEnrollmentDto dto)
        {
            try
            {
                var result = await _classService.EnrollStudentAsync(id, dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET /api/class/tuition-alerts — Cảnh báo học viên nợ học phí
        [Authorize(Roles = "Admin,Manager,Instructor")]
        [HttpGet("tuition-alerts")]
        public async Task<IActionResult> GetTuitionAlerts()
        {
            var alerts = await _classService.GetTuitionAlertsAsync();
            return Ok(alerts);
        }

        // GET /api/class/students — Lấy danh sách tất cả học viên
        [HttpGet("students")]
        public async Task<IActionResult> GetAllStudents()
        {
            var students = await _classService.GetAllStudentsAsync();
            return Ok(students);
        }

        // POST /api/class/students — Tạo học viên mới
        [Authorize(Roles = "Admin,Manager")]
        [HttpPost("students")]
        public async Task<IActionResult> CreateStudent([FromBody] StudentDto dto)
        {
            try
            {
                var result = await _classService.CreateStudentAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    public class AssignInstructorDto
    {
        public Guid InstructorId { get; set; }
    }
}
