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

namespace Quan_ly_nhan_su.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/attendance")]
    public class AttendanceController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public AttendanceController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet]
        public async Task<IActionResult> GetAttendanceLogs([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var query = _unitOfWork.Repository<Attendance>().Query()
                .Include(a => a.Employee)
                .OrderByDescending(a => a.Date)
                .AsQueryable();

            if (CurrentUserRole == "Employee")
            {
                query = query.Where(a => a.EmployeeId == CurrentUserId);
            }
            else if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager != null && manager.DepartmentId != null)
                {
                    query = query.Where(a => a.Employee!.DepartmentId == manager.DepartmentId);
                }
            }

            if (startDate.HasValue)
            {
                query = query.Where(a => a.Date >= startDate.Value.Date);
            }
            if (endDate.HasValue)
            {
                query = query.Where(a => a.Date <= endDate.Value.Date);
            }

            var logs = await query.ToListAsync();
            return Ok(logs.Select(MapToDto));
        }

        [HttpGet("today")]
        public async Task<IActionResult> GetTodayStatus()
        {
            var today = DateTime.UtcNow.AddHours(7).Date; // GMT+7 Local Time Date
            var log = await _unitOfWork.Repository<Attendance>()
                .Query(a => a.EmployeeId == CurrentUserId && a.Date == today)
                .FirstOrDefaultAsync();

            if (log == null)
            {
                return Ok(new { checkedIn = false, checkedOut = false, log = (object?)null });
            }

            return Ok(new
            {
                checkedIn = true,
                checkedOut = log.CheckOutTime.HasValue,
                log = MapToDto(log)
            });
        }

        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn()
        {
            var localNow = DateTime.UtcNow.AddHours(7); // GMT+7 Local Time
            var today = localNow.Date;

            var existing = await _unitOfWork.Repository<Attendance>()
                .Query(a => a.EmployeeId == CurrentUserId && a.Date == today)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                return BadRequest("Bạn đã check-in hôm nay rồi.");
            }

            // Standard check-in limit: 08:30 AM
            var status = "Present";
            if (localNow.Hour > 8 || (localNow.Hour == 8 && localNow.Minute > 30))
            {
                status = "Late";
            }

            var attendance = new Attendance
            {
                Id = Guid.NewGuid(),
                EmployeeId = CurrentUserId,
                Date = today,
                CheckInTime = localNow,
                Status = status
            };

            await _unitOfWork.Repository<Attendance>().AddAsync(attendance);
            await _unitOfWork.SaveChangesAsync();

            return Ok(MapToDto(attendance));
        }

        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut()
        {
            var localNow = DateTime.UtcNow.AddHours(7);
            var today = localNow.Date;

            var attendance = await _unitOfWork.Repository<Attendance>()
                .Query(a => a.EmployeeId == CurrentUserId && a.Date == today)
                .FirstOrDefaultAsync();

            if (attendance == null)
            {
                return BadRequest("Bạn chưa thực hiện Check-in hôm nay.");
            }

            if (attendance.CheckOutTime.HasValue)
            {
                return BadRequest("Bạn đã check-out hôm nay rồi.");
            }

            attendance.CheckOutTime = localNow;
            
            // Calculate working hours
            if (attendance.CheckInTime.HasValue)
            {
                var duration = localNow - attendance.CheckInTime.Value;
                attendance.WorkHours = Math.Round(duration.TotalHours, 2);
            }

            // Update status if early leave (e.g., standard check-out is 5:30 PM = 17:30)
            if (localNow.Hour < 17 || (localNow.Hour == 17 && localNow.Minute < 30))
            {
                if (attendance.Status == "Present")
                {
                    attendance.Status = "EarlyLeave";
                }
                else
                {
                    attendance.Status += ",EarlyLeave";
                }
            }

            _unitOfWork.Repository<Attendance>().Update(attendance);
            await _unitOfWork.SaveChangesAsync();

            return Ok(MapToDto(attendance));
        }

        private static AttendanceDto MapToDto(Attendance a)
        {
            return new AttendanceDto
            {
                Id = a.Id,
                EmployeeId = a.EmployeeId,
                EmployeeName = a.Employee?.FullName ?? string.Empty,
                Date = a.Date,
                CheckInTime = a.CheckInTime,
                CheckOutTime = a.CheckOutTime,
                WorkHours = a.WorkHours,
                Status = a.Status
            };
        }
    }
}
