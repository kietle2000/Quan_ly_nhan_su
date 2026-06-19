using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quan_ly_nhan_su.Application.DTOs;
using Quan_ly_nhan_su.Application.Exceptions;
using Quan_ly_nhan_su.Application.Interfaces;
using Quan_ly_nhan_su.Domain.Entities;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/employee")]
    public class EmployeeController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public EmployeeController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] Guid? departmentId)
        {
            var query = _unitOfWork.Repository<Employee>().Query()
                .Include(x => x.Department)
                .Include(x => x.Position);

            if (CurrentUserRole == "Employee")
            {
                // Employees cannot list other employees
                return Forbid("Không có quyền xem danh sách nhân viên.");
            }

            if (CurrentUserRole == "Manager")
            {
                // Managers can only see employees in their department
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager == null || manager.DepartmentId == null)
                {
                    return Ok(new List<EmployeeDto>());
                }
                
                var employees = await query.Where(x => x.DepartmentId == manager.DepartmentId).ToListAsync();
                return Ok(employees.Select(MapToDto));
            }

            // Admin can see all, filterable by department
            var q = query.AsQueryable();
            if (departmentId.HasValue)
            {
                q = q.Where(x => x.DepartmentId == departmentId.Value);
            }

            var allEmployees = await q.ToListAsync();
            return Ok(allEmployees.Select(MapToDto));
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var employee = await _unitOfWork.Repository<Employee>().Query(x => x.Id == CurrentUserId)
                .Include(x => x.Department)
                .Include(x => x.Position)
                .FirstOrDefaultAsync();

            if (employee == null) return NotFound("Không tìm thấy thông tin cá nhân.");
            return Ok(MapToDto(employee));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var employee = await _unitOfWork.Repository<Employee>().Query(x => x.Id == id)
                .Include(x => x.Department)
                .Include(x => x.Position)
                .FirstOrDefaultAsync();

            if (employee == null) return NotFound("Không tìm thấy nhân viên.");

            // Security check
            if (CurrentUserRole == "Employee" && id != CurrentUserId)
            {
                return Forbid("Bạn chỉ được xem thông tin cá nhân của mình.");
            }

            if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager == null || manager.DepartmentId != employee.DepartmentId)
                {
                    return Forbid("Bạn chỉ được xem nhân viên thuộc phòng ban của mình.");
                }
            }

            return Ok(MapToDto(employee));
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] RegisterRequest request)
        {
            // Create using Register flow
            var authService = HttpContext.RequestServices.GetService(typeof(IAuthService)) as IAuthService;
            if (authService == null) return StatusCode(500, "Auth service unavailable");
            
            var employeeDto = await authService.RegisterAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = employeeDto.Id }, employeeDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeDto dto)
        {
            var employee = await _unitOfWork.Repository<Employee>().GetByIdAsync(id);
            if (employee == null) return NotFound("Không tìm thấy nhân viên.");

            // Security Check
            if (CurrentUserRole == "Employee")
            {
                if (id != CurrentUserId)
                {
                    return Forbid("Bạn chỉ có thể chỉnh sửa thông tin của chính mình.");
                }
                
                // Employees can only update name and phone
                employee.FullName = dto.FullName;
                employee.Phone = dto.Phone;
            }
            else if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager == null || manager.DepartmentId != employee.DepartmentId)
                {
                    return Forbid("Bạn chỉ có thể quản lý nhân viên thuộc phòng ban của mình.");
                }

                if (employee.Role == UserRole.Admin || dto.Role == "Admin")
                {
                    return Forbid("Bạn không thể thay đổi vai trò Admin.");
                }

                employee.FullName = dto.FullName;
                employee.Phone = dto.Phone;
                employee.IsActive = dto.IsActive;
                
                if (Enum.TryParse<UserRole>(dto.Role, out var roleEnum))
                {
                    employee.Role = roleEnum;
                }
                employee.PositionId = dto.PositionId;
            }
            else // Admin
            {
                employee.FullName = dto.FullName;
                employee.Phone = dto.Phone;
                employee.IsActive = dto.IsActive;
                employee.DepartmentId = dto.DepartmentId;
                employee.PositionId = dto.PositionId;
                
                if (Enum.TryParse<UserRole>(dto.Role, out var roleEnum))
                {
                    employee.Role = roleEnum;
                }
            }

            employee.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Repository<Employee>().Update(employee);
            await _unitOfWork.SaveChangesAsync();

            // Fetch updated employee with relations
            var updated = await _unitOfWork.Repository<Employee>().Query(x => x.Id == id)
                .Include(x => x.Department)
                .Include(x => x.Position)
                .FirstAsync();

            return Ok(MapToDto(updated));
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var employee = await _unitOfWork.Repository<Employee>().GetByIdAsync(id);
            if (employee == null) return NotFound("Không tìm thấy nhân viên.");

            if (id == CurrentUserId)
            {
                return BadRequest("Bạn không thể tự xóa tài khoản của chính mình.");
            }

            _unitOfWork.Repository<Employee>().Delete(employee);
            await _unitOfWork.SaveChangesAsync();
            return Ok(new { message = "Xóa nhân viên thành công." });
        }

        private EmployeeDto MapToDto(Employee employee)
        {
            return new EmployeeDto
            {
                Id = employee.Id,
                FullName = employee.FullName,
                Email = employee.Email,
                Phone = employee.Phone,
                Role = employee.Role.ToString(),
                DepartmentId = employee.DepartmentId,
                DepartmentName = employee.Department?.Name,
                PositionId = employee.PositionId,
                PositionName = employee.Position?.Name,
                IsActive = employee.IsActive,
                CreatedAt = employee.CreatedAt
            };
        }
    }
}
