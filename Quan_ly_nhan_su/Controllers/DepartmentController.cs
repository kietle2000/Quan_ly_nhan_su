using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quan_ly_nhan_su.Application.DTOs;
using Quan_ly_nhan_su.Application.Interfaces;
using Quan_ly_nhan_su.Domain.Entities;

namespace Quan_ly_nhan_su.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/department")]
    public class DepartmentController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public DepartmentController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var depts = await _unitOfWork.Repository<Department>().Query()
                .Include(d => d.Manager)
                .Include(d => d.Employees)
                .ToListAsync();

            var dtos = depts.Select(d => new DepartmentDto
            {
                Id = d.Id,
                Name = d.Name,
                Description = d.Description,
                ManagerId = d.ManagerId,
                ManagerName = d.Manager?.FullName,
                EmployeeCount = d.Employees.Count
            });

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var dept = await _unitOfWork.Repository<Department>().Query(d => d.Id == id)
                .Include(d => d.Manager)
                .Include(d => d.Employees)
                .FirstOrDefaultAsync();

            if (dept == null) return NotFound("Không tìm thấy phòng ban.");

            return Ok(new DepartmentDto
            {
                Id = dept.Id,
                Name = dept.Name,
                Description = dept.Description,
                ManagerId = dept.ManagerId,
                ManagerName = dept.Manager?.FullName,
                EmployeeCount = dept.Employees.Count
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDepartmentDto dto)
        {
            var dept = new Department
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                ManagerId = dto.ManagerId
            };

            await _unitOfWork.Repository<Department>().AddAsync(dept);
            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = dept.Id }, dto);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateDepartmentDto dto)
        {
            var dept = await _unitOfWork.Repository<Department>().GetByIdAsync(id);
            if (dept == null) return NotFound("Không tìm thấy phòng ban.");

            dept.Name = dto.Name;
            dept.Description = dto.Description;
            dept.ManagerId = dto.ManagerId;

            _unitOfWork.Repository<Department>().Update(dept);
            await _unitOfWork.SaveChangesAsync();

            return Ok(dto);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var dept = await _unitOfWork.Repository<Department>().GetByIdAsync(id);
            if (dept == null) return NotFound("Không tìm thấy phòng ban.");

            _unitOfWork.Repository<Department>().Delete(dept);
            await _unitOfWork.SaveChangesAsync();
            return Ok(new { message = "Xóa phòng ban thành công." });
        }
    }
}
