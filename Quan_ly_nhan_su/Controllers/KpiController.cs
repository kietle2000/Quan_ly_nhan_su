using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quan_ly_nhan_su.Application.DTOs;
using Quan_ly_nhan_su.Application.Interfaces;
using Quan_ly_nhan_su.Domain.Entities;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/kpi")]
    public class KpiController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public KpiController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet]
        public async Task<IActionResult> GetKpis([FromQuery] string? period)
        {
            var query = _unitOfWork.Repository<Kpi>().Query()
                .Include(k => k.Employee)
                .AsQueryable();

            if (CurrentUserRole == "Employee")
            {
                query = query.Where(k => k.EmployeeId == CurrentUserId);
            }
            else if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager != null && manager.DepartmentId != null)
                {
                    query = query.Where(k => k.Employee!.DepartmentId == manager.DepartmentId);
                }
            }

            if (!string.IsNullOrEmpty(period) && Enum.TryParse<KpiPeriod>(period, true, out var periodEnum))
            {
                query = query.Where(k => k.Period == periodEnum);
            }

            var kpis = await query.ToListAsync();
            return Ok(kpis.Select(MapToDto));
        }

        [Authorize(Roles = "Admin,Manager")]
        [HttpPost]
        public async Task<IActionResult> CreateKpi([FromBody] CreateKpiDto dto)
        {
            if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                var targetEmployee = await _unitOfWork.Repository<Employee>().GetByIdAsync(dto.EmployeeId);
                if (manager == null || targetEmployee == null || manager.DepartmentId != targetEmployee.DepartmentId)
                {
                    return Forbid("Bạn chỉ có thể giao KPI cho nhân viên thuộc phòng ban của mình.");
                }
            }

            if (!Enum.TryParse<KpiPeriod>(dto.Period, true, out var periodEnum))
            {
                return BadRequest("Chu kỳ KPI không hợp lệ (Weekly, Monthly, Yearly).");
            }

            var kpi = new Kpi
            {
                Id = Guid.NewGuid(),
                EmployeeId = dto.EmployeeId,
                TargetName = dto.TargetName,
                TargetValue = dto.TargetValue,
                CurrentValue = 0,
                Unit = dto.Unit,
                Period = periodEnum,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Status = "InProgress"
            };

            await _unitOfWork.Repository<Kpi>().AddAsync(kpi);
            await _unitOfWork.SaveChangesAsync();
            return Ok(MapToDto(kpi));
        }

        [HttpPut("{id}/value")]
        public async Task<IActionResult> UpdateValue(Guid id, [FromBody] UpdateKpiValueDto dto)
        {
            var kpi = await _unitOfWork.Repository<Kpi>()
                .Query(k => k.Id == id)
                .Include(k => k.Employee)
                .FirstOrDefaultAsync();

            if (kpi == null) return NotFound("Không tìm thấy KPI.");

            // Security Check
            if (CurrentUserRole == "Employee" && kpi.EmployeeId != CurrentUserId)
            {
                return Forbid("Bạn không có quyền cập nhật KPI này.");
            }

            if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager == null || manager.DepartmentId != kpi.Employee!.DepartmentId)
                {
                    return Forbid("Bạn chỉ có thể cập nhật KPI của nhân viên phòng mình.");
                }
            }

            kpi.CurrentValue = dto.CurrentValue;
            
            // Auto update status
            if (kpi.CurrentValue >= kpi.TargetValue)
            {
                kpi.Status = "Achieved";
            }
            else if (DateTime.UtcNow.Date > kpi.EndDate.Date && kpi.CurrentValue < kpi.TargetValue)
            {
                kpi.Status = "Failed";
            }
            else
            {
                kpi.Status = "InProgress";
            }

            _unitOfWork.Repository<Kpi>().Update(kpi);
            await _unitOfWork.SaveChangesAsync();
            return Ok(MapToDto(kpi));
        }

        [Authorize(Roles = "Admin,Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteKpi(Guid id)
        {
            var kpi = await _unitOfWork.Repository<Kpi>().GetByIdAsync(id);
            if (kpi == null) return NotFound("Không tìm thấy KPI.");

            _unitOfWork.Repository<Kpi>().Delete(kpi);
            await _unitOfWork.SaveChangesAsync();
            return Ok(new { message = "Xóa KPI thành công." });
        }

        private static KpiDto MapToDto(Kpi kpi)
        {
            return new KpiDto
            {
                Id = kpi.Id,
                EmployeeId = kpi.EmployeeId,
                EmployeeName = kpi.Employee?.FullName ?? string.Empty,
                TargetName = kpi.TargetName,
                TargetValue = kpi.TargetValue,
                CurrentValue = kpi.CurrentValue,
                Unit = kpi.Unit,
                Period = kpi.Period.ToString(),
                StartDate = kpi.StartDate,
                EndDate = kpi.EndDate,
                Status = kpi.Status
            };
        }
    }
}
