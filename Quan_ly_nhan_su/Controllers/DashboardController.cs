using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quan_ly_nhan_su.Application.Interfaces;
using Quan_ly_nhan_su.Domain.Entities;
using Quan_ly_nhan_su.Domain.Enums;
using System.Security.Claims;
using System.Collections.Generic;

namespace Quan_ly_nhan_su.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public DashboardController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var today = DateTime.UtcNow.AddHours(7).Date;

            if (CurrentUserRole == "Admin")
            {
                var totalEmployees = await _unitOfWork.Repository<Employee>().Query(e => e.IsActive).CountAsync();
                var checkedInToday = await _unitOfWork.Repository<Attendance>().Query(a => a.Date == today && a.CheckInTime != null).CountAsync();
                var newLeadsThisWeek = await _unitOfWork.Repository<Lead>().Query(l => l.CreatedAt >= today.AddDays(-7)).CountAsync();
                var pendingLeaveRequests = await _unitOfWork.Repository<LeaveRequest>().Query(l => l.Status == LeaveStatus.Pending).CountAsync();
                
                var kpis = await _unitOfWork.Repository<Kpi>().Query(k => k.Status == "InProgress").ToListAsync();
                double avgKpiProgress = kpis.Count > 0 ? kpis.Average(k => k.TargetValue > 0 ? (k.CurrentValue / k.TargetValue * 100) : 0) : 0;

                var deptStats = await _unitOfWork.Repository<Department>().Query()
                    .Include(d => d.Employees)
                    .Select(d => new { d.Name, count = d.Employees.Count })
                    .ToListAsync();

                return Ok(new
                {
                    role = "Admin",
                    totalEmployees,
                    checkedInToday,
                    attendanceRate = totalEmployees > 0 ? Math.Round((double)checkedInToday / totalEmployees * 100, 1) : 0,
                    newLeadsThisWeek,
                    pendingLeaveRequests,
                    avgKpiProgress = Math.Round(avgKpiProgress, 1),
                    departmentStats = deptStats
                });
            }

            if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().Query(e => e.Id == CurrentUserId)
                    .Include(e => e.Department).FirstOrDefaultAsync();
                var deptId = manager?.DepartmentId;

                var deptEmployees = await _unitOfWork.Repository<Employee>().Query(e => e.DepartmentId == deptId && e.IsActive).CountAsync();
                var deptCheckedIn = await _unitOfWork.Repository<Attendance>()
                    .Query(a => a.Date == today && a.CheckInTime != null && a.Employee!.DepartmentId == deptId).CountAsync();
                var pendingLeave = await _unitOfWork.Repository<LeaveRequest>()
                    .Query(l => l.Status == LeaveStatus.Pending && l.Employee!.DepartmentId == deptId).CountAsync();
                var pendingPlans = await _unitOfWork.Repository<WeeklyWorkPlan>()
                    .Query(w => w.Employee!.DepartmentId == deptId)
                    .Where(w => w.WeekNumber == GetIso8601WeekOfYear(today) && w.Year == today.Year)
                    .CountAsync();

                return Ok(new
                {
                    role = "Manager",
                    departmentName = manager?.Department?.Name,
                    deptEmployees,
                    deptCheckedIn,
                    attendanceRate = deptEmployees > 0 ? Math.Round((double)deptCheckedIn / deptEmployees * 100, 1) : 0,
                    pendingLeave,
                    pendingPlans
                });
            }

            // Employee
            var empAttendance = await _unitOfWork.Repository<Attendance>()
                .Query(a => a.EmployeeId == CurrentUserId && a.Date == today).FirstOrDefaultAsync();

            var myKpis = await _unitOfWork.Repository<Kpi>()
                .Query(k => k.EmployeeId == CurrentUserId && k.Status == "InProgress").ToListAsync();

            var myLeads = await _unitOfWork.Repository<Lead>()
                .Query(l => l.OwnerId == CurrentUserId).CountAsync();

            var myPendingLeave = await _unitOfWork.Repository<LeaveRequest>()
                .Query(l => l.EmployeeId == CurrentUserId && l.Status == LeaveStatus.Pending).CountAsync();

            return Ok(new
            {
                role = "Employee",
                checkedIn = empAttendance?.CheckInTime != null,
                checkedOut = empAttendance?.CheckOutTime != null,
                workHoursToday = empAttendance?.WorkHours ?? 0,
                myLeads,
                myPendingLeave,
                myKpis = myKpis.Select(k => new
                {
                    k.TargetName,
                    k.TargetValue,
                    k.CurrentValue,
                    k.Unit,
                    progress = k.TargetValue > 0 ? Math.Round(k.CurrentValue / k.TargetValue * 100, 1) : 0
                })
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("kpi-chart")]
        public async Task<IActionResult> GetKpiChart([FromQuery] string period = "Monthly")
        {
            if (!Enum.TryParse<KpiPeriod>(period, true, out var periodEnum)) periodEnum = KpiPeriod.Monthly;

            var kpis = await _unitOfWork.Repository<Kpi>()
                .Query(k => k.Period == periodEnum)
                .Include(k => k.Employee)
                .ToListAsync();

            var grouped = kpis.GroupBy(k => k.Employee?.FullName ?? "Unknown")
                .Select(g => new
                {
                    employee = g.Key,
                    targets = g.Select(k => new
                    {
                        k.TargetName,
                        k.TargetValue,
                        k.CurrentValue,
                        k.Unit,
                        progress = k.TargetValue > 0 ? Math.Round(k.CurrentValue / k.TargetValue * 100, 1) : 0
                    })
                });

            return Ok(grouped);
        }

        [Authorize(Roles = "Admin,Manager")]
        [HttpGet("lead-funnel")]
        public async Task<IActionResult> GetLeadFunnel()
        {
            var leads = await _unitOfWork.Repository<Lead>().GetAllAsync();
            var funnel = new[]
            {
                new { status = "New", count = leads.Count(l => l.Status == LeadStatus.New) },
                new { status = "Contacted", count = leads.Count(l => l.Status == LeadStatus.Contacted) },
                new { status = "Consulting", count = leads.Count(l => l.Status == LeadStatus.Consulting) },
                new { status = "Signed", count = leads.Count(l => l.Status == LeadStatus.Signed) },
                new { status = "Lost", count = leads.Count(l => l.Status == LeadStatus.Lost) }
            };
            return Ok(funnel);
        }

        [Authorize(Roles = "Admin,Manager")]
        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard()
        {
            // Bảng xếp hạng theo Doanh thu khách hàng đã chốt (Signed)
            var signedLeads = await _unitOfWork.Repository<Lead>()
                .Query(l => l.Status == LeadStatus.Signed && l.OwnerId != null && l.Revenue > 0)
                .Include(l => l.Owner)
                .ToListAsync();

            var leaderboard = signedLeads
                .GroupBy(l => new { l.OwnerId, l.Owner?.FullName })
                .Select(g => new
                {
                    employeeId = g.Key.OwnerId,
                    employeeName = g.Key.FullName,
                    totalRevenue = g.Sum(l => l.Revenue ?? 0),
                    contracts = g.Count()
                })
                .OrderByDescending(x => x.totalRevenue)
                .Take(10)
                .ToList();

            return Ok(leaderboard);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("revenue-forecast")]
        public async Task<IActionResult> GetRevenueForecast()
        {
            // Doanh thu dự báo = (Doanh thu đã chốt) + (Doanh thu dự kiến từ Consulting * 30% tỷ lệ chốt)
            var allLeads = await _unitOfWork.Repository<Lead>().Query(l => l.Revenue > 0).ToListAsync();
            
            var signedRevenue = allLeads.Where(l => l.Status == LeadStatus.Signed).Sum(l => l.Revenue ?? 0);
            var expectedRevenue = allLeads.Where(l => l.Status == LeadStatus.Consulting).Sum(l => l.Revenue ?? 0) * 0.3m; // Giả sử 30% tỷ lệ chốt

            return Ok(new
            {
                actualRevenue = signedRevenue,
                forecastedExtraRevenue = expectedRevenue,
                totalExpected = signedRevenue + expectedRevenue
            });
        }

        [HttpGet("daily-activities")]
        public async Task<IActionResult> GetDailyActivities()
        {
            var today = DateTime.UtcNow.AddHours(7).Date;
            
            var employees = await _unitOfWork.Repository<Employee>().Query(e => e.IsActive).ToListAsync();
            var attendances = await _unitOfWork.Repository<Attendance>().Query(a => a.Date == today).ToListAsync();
            
            // Lấy danh sách khách hàng để đếm tổng số khách của từng nhân viên
            var leads = await _unitOfWork.Repository<Lead>()
                .GetAllAsync();

            // Lấy kế hoạch làm việc của ngày hôm nay (thay vì CRM Activity)
            var workPlanItems = await _unitOfWork.Repository<WorkPlanItem>()
                .Query(w => w.Deadline.Date == today)
                .Include(w => w.WeeklyWorkPlan)
                .ToListAsync();

            var result = employees.Select(emp =>
            {
                var att = attendances.FirstOrDefault(a => a.EmployeeId == emp.Id);
                var activeLeadsCount = leads.Count(l => l.OwnerId == emp.Id);
                var latestLog = workPlanItems.FirstOrDefault(w => w.WeeklyWorkPlan?.EmployeeId == emp.Id);

                return new
                {
                    employeeId = emp.Id,
                    employeeName = emp.FullName,
                    avatar = emp.FullName.Substring(0, 1).ToUpper(),
                    checkInTime = att?.CheckInTime,
                    activeLeads = activeLeadsCount,
                    latestActivity = latestLog != null ? new
                    {
                        content = latestLog.TaskName + (string.IsNullOrEmpty(latestLog.ActionPlan) ? "" : " (" + latestLog.ActionPlan + ")"),
                        time = latestLog.Deadline,
                        leadName = "Kế hoạch làm việc"
                    } : null
                };
            }).OrderBy(x => x.employeeName).ToList();

            return Ok(result);
        }

        private static int GetIso8601WeekOfYear(DateTime date)
        {
            var cal = System.Globalization.CultureInfo.InvariantCulture.Calendar;
            return cal.GetWeekOfYear(date, System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
        }
    }
}
