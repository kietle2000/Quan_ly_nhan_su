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
    [Route("api/leaverequest")]
    public class LeaveRequestController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public LeaveRequestController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet]
        public async Task<IActionResult> GetRequests()
        {
            var query = _unitOfWork.Repository<LeaveRequest>().Query()
                .Include(l => l.Employee)
                    .ThenInclude(e => e!.Department)
                .Include(l => l.ApprovedBy)
                .OrderByDescending(l => l.CreatedAt)
                .AsQueryable();

            if (CurrentUserRole == "Employee")
            {
                query = query.Where(l => l.EmployeeId == CurrentUserId);
            }
            else if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager != null && manager.DepartmentId != null)
                {
                    query = query.Where(l => l.Employee!.DepartmentId == manager.DepartmentId);
                }
            }

            var requests = await query.ToListAsync();
            return Ok(requests.Select(MapToDto));
        }

        [HttpPost]
        public async Task<IActionResult> SubmitRequest([FromBody] CreateLeaveRequestDto dto)
        {
            var request = new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeId = CurrentUserId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Reason = dto.Reason,
                LeaveType = dto.LeaveType,
                Status = LeaveStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<LeaveRequest>().AddAsync(request);
            await _unitOfWork.SaveChangesAsync();
            return Ok(MapToDto(request));
        }

        [Authorize(Roles = "Admin,Manager")]
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveRequest(Guid id, [FromBody] ApproveLeaveRequestDto dto)
        {
            var request = await _unitOfWork.Repository<LeaveRequest>()
                .Query(l => l.Id == id)
                .Include(l => l.Employee)
                .FirstOrDefaultAsync();

            if (request == null) return NotFound("Không tìm thấy đơn xin nghỉ phép.");

            // Security Check
            if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager == null || manager.DepartmentId != request.Employee!.DepartmentId)
                {
                    return Forbid("Bạn chỉ được duyệt đơn của nhân viên phòng mình.");
                }
            }

            if (!Enum.TryParse<LeaveStatus>(dto.Status, true, out var statusEnum))
            {
                return BadRequest("Trạng thái duyệt không hợp lệ (Approved, Rejected).");
            }

            request.Status = statusEnum;
            request.ApprovedById = CurrentUserId;
            request.ApprovalNotes = dto.ApprovalNotes;

            _unitOfWork.Repository<LeaveRequest>().Update(request);
            
            // Auto add Attendance log as Present/Excused or leave for those dates
            if (statusEnum == LeaveStatus.Approved)
            {
                var currentDate = request.StartDate.Date;
                while (currentDate <= request.EndDate.Date)
                {
                    // If weekday (Mon-Fri)
                    if (currentDate.DayOfWeek != DayOfWeek.Saturday && currentDate.DayOfWeek != DayOfWeek.Sunday)
                    {
                        var att = await _unitOfWork.Repository<Attendance>()
                            .Query(a => a.EmployeeId == request.EmployeeId && a.Date == currentDate)
                            .FirstOrDefaultAsync();

                        if (att == null)
                        {
                            await _unitOfWork.Repository<Attendance>().AddAsync(new Attendance
                            {
                                Id = Guid.NewGuid(),
                                EmployeeId = request.EmployeeId,
                                Date = currentDate,
                                Status = $"OnLeave ({request.LeaveType})"
                            });
                        }
                    }
                    currentDate = currentDate.AddDays(1);
                }
            }

            await _unitOfWork.SaveChangesAsync();
            return Ok(new { message = $"Đã cập nhật trạng thái đơn: {dto.Status}." });
        }

        private static LeaveRequestDto MapToDto(LeaveRequest l)
        {
            return new LeaveRequestDto
            {
                Id = l.Id,
                EmployeeId = l.EmployeeId,
                EmployeeName = l.Employee?.FullName ?? string.Empty,
                DepartmentName = l.Employee?.Department?.Name,
                StartDate = l.StartDate,
                EndDate = l.EndDate,
                Reason = l.Reason,
                LeaveType = l.LeaveType,
                Status = l.Status.ToString(),
                ApprovedById = l.ApprovedById,
                ApprovedByName = l.ApprovedBy?.FullName,
                ApprovalNotes = l.ApprovalNotes,
                CreatedAt = l.CreatedAt
            };
        }
    }
}
