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
    [Route("api/workplan")]
    public class WorkPlanController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public WorkPlanController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet]
        public async Task<IActionResult> GetPlans([FromQuery] int week, [FromQuery] int year)
        {
            var query = _unitOfWork.Repository<WeeklyWorkPlan>().Query(w => w.WeekNumber == week && w.Year == year)
                .Include(w => w.Employee)
                .Include(w => w.WorkPlanItems)
                    .ThenInclude(wi => wi.Supporter);

            if (CurrentUserRole == "Employee")
            {
                // Employees only see their own plan
                var plans = await query.Where(w => w.EmployeeId == CurrentUserId).ToListAsync();
                var dtos = new List<WeeklyWorkPlanDto>();
                foreach(var plan in plans) dtos.Add(await MapToDtoAsync(plan));
                return Ok(dtos);
            }

            if (CurrentUserRole == "Manager")
            {
                // Managers see their department plans
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager == null || manager.DepartmentId == null) return Ok(new List<WeeklyWorkPlanDto>());

                var plans = await query.Where(w => w.Employee!.DepartmentId == manager.DepartmentId).ToListAsync();
                var dtos = new List<WeeklyWorkPlanDto>();
                foreach(var plan in plans) dtos.Add(await MapToDtoAsync(plan));
                return Ok(dtos);
            }

            // Admin sees all plans
            var allPlans = await query.ToListAsync();
            var allDtos = new List<WeeklyWorkPlanDto>();
            foreach(var plan in allPlans) allDtos.Add(await MapToDtoAsync(plan));
            return Ok(allDtos);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyCurrentPlan([FromQuery] int week, [FromQuery] int year)
        {
            var plan = await _unitOfWork.Repository<WeeklyWorkPlan>()
                .Query(w => w.EmployeeId == CurrentUserId && w.WeekNumber == week && w.Year == year)
                .Include(w => w.WorkPlanItems)
                    .ThenInclude(wi => wi.Supporter)
                .FirstOrDefaultAsync();

            if (plan == null)
            {
                return Ok(new WeeklyWorkPlanDto
                {
                    EmployeeId = CurrentUserId,
                    WeekNumber = week,
                    Year = year,
                    WorkPlanItems = new List<WorkPlanItemDto>()
                });
            }

            return Ok(await MapToDtoAsync(plan));
        }

        [HttpPost]
        public async Task<IActionResult> SavePlan([FromBody] CreateWeeklyWorkPlanDto dto)
        {
            Guid targetEmployeeId = CurrentUserId;
            if (CurrentUserRole == "Admin" || CurrentUserRole == "Manager")
            {
                if (dto.EmployeeId.HasValue)
                {
                    targetEmployeeId = dto.EmployeeId.Value;
                }
            }

            // Check if plan already exists for employee/week/year
            var existingPlan = await _unitOfWork.Repository<WeeklyWorkPlan>()
                .Query(w => w.EmployeeId == targetEmployeeId && w.WeekNumber == dto.WeekNumber && w.Year == dto.Year)
                .Include(w => w.WorkPlanItems)
                .FirstOrDefaultAsync();

            if (existingPlan != null)
            {
                // Update target and notes
                existingPlan.Target = dto.Target;
                existingPlan.Notes = dto.Notes;
                
                existingPlan.TargetNew = dto.TargetNew;
                existingPlan.TargetContacted = dto.TargetContacted;
                existingPlan.TargetConsulting = dto.TargetConsulting;
                existingPlan.TargetMeeting = dto.TargetMeeting;
                existingPlan.TargetSigned = dto.TargetSigned;

                existingPlan.EvalNew = dto.EvalNew;
                existingPlan.EvalContacted = dto.EvalContacted;
                existingPlan.EvalConsulting = dto.EvalConsulting;
                existingPlan.EvalMeeting = dto.EvalMeeting;
                existingPlan.EvalSigned = dto.EvalSigned;
                existingPlan.FailureReasonAnalysis = dto.FailureReasonAnalysis;

                // Sync items
                // Remove existing items and rebuild to avoid complex mapping issues
                foreach (var item in existingPlan.WorkPlanItems)
                {
                    _unitOfWork.Repository<WorkPlanItem>().Delete(item);
                }

                foreach (var itemDto in dto.WorkPlanItems)
                {
                    var item = new WorkPlanItem
                    {
                        Id = Guid.NewGuid(),
                        WeeklyWorkPlanId = existingPlan.Id,
                        TaskName = itemDto.TaskName,
                        ActionPlan = itemDto.ActionPlan,
                        SupporterId = itemDto.SupporterId,
                        Deadline = itemDto.Deadline,
                        Kpi = itemDto.Kpi,
                        Status = WorkItemStatus.Pending,
                        Notes = itemDto.Notes
                    };
                    await _unitOfWork.Repository<WorkPlanItem>().AddAsync(item);
                }

                _unitOfWork.Repository<WeeklyWorkPlan>().Update(existingPlan);
            }
            else
            {
                // Create new plan
                var newPlan = new WeeklyWorkPlan
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = targetEmployeeId,
                    WeekNumber = dto.WeekNumber,
                    Year = dto.Year,
                    Target = dto.Target,
                    Notes = dto.Notes,
                    
                    TargetNew = dto.TargetNew,
                    TargetContacted = dto.TargetContacted,
                    TargetConsulting = dto.TargetConsulting,
                    TargetMeeting = dto.TargetMeeting,
                    TargetSigned = dto.TargetSigned,

                    EvalNew = dto.EvalNew,
                    EvalContacted = dto.EvalContacted,
                    EvalConsulting = dto.EvalConsulting,
                    EvalMeeting = dto.EvalMeeting,
                    EvalSigned = dto.EvalSigned,
                    FailureReasonAnalysis = dto.FailureReasonAnalysis
                };

                await _unitOfWork.Repository<WeeklyWorkPlan>().AddAsync(newPlan);

                foreach (var itemDto in dto.WorkPlanItems)
                {
                    var item = new WorkPlanItem
                    {
                        Id = Guid.NewGuid(),
                        WeeklyWorkPlanId = newPlan.Id,
                        TaskName = itemDto.TaskName,
                        ActionPlan = itemDto.ActionPlan,
                        SupporterId = itemDto.SupporterId,
                        Deadline = itemDto.Deadline,
                        Kpi = itemDto.Kpi,
                        Status = WorkItemStatus.Pending,
                        Notes = itemDto.Notes
                    };
                    await _unitOfWork.Repository<WorkPlanItem>().AddAsync(item);
                }
            }

            await _unitOfWork.SaveChangesAsync();

            var savedPlan = await _unitOfWork.Repository<WeeklyWorkPlan>()
                .Query(w => w.EmployeeId == targetEmployeeId && w.WeekNumber == dto.WeekNumber && w.Year == dto.Year)
                .Include(w => w.WorkPlanItems)
                    .ThenInclude(wi => wi.Supporter)
                .FirstAsync();

            return Ok(await MapToDtoAsync(savedPlan));
        }

        [HttpPut("item/{itemId}")]
        public async Task<IActionResult> UpdateItem(Guid itemId, [FromBody] UpdateWorkPlanItemDto dto)
        {
            var item = await _unitOfWork.Repository<WorkPlanItem>()
                .Query(wi => wi.Id == itemId)
                .Include(wi => wi.WeeklyWorkPlan)
                .FirstOrDefaultAsync();

            if (item == null) return NotFound("Không tìm thấy đầu việc.");

            // Security Check: owner of plan can edit, or their manager
            if (CurrentUserRole == "Employee" && item.WeeklyWorkPlan!.EmployeeId != CurrentUserId)
            {
                return Forbid("Bạn không có quyền sửa đổi kế hoạch này.");
            }

            if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                var planOwner = await _unitOfWork.Repository<Employee>().GetByIdAsync(item.WeeklyWorkPlan!.EmployeeId);
                if (manager == null || planOwner == null || manager.DepartmentId != planOwner.DepartmentId)
                {
                    return Forbid("Bạn chỉ có thể quản lý công việc của nhân viên thuộc phòng của mình.");
                }
            }

            item.TaskName = dto.TaskName;
            item.ActionPlan = dto.ActionPlan;
            item.SupporterId = dto.SupporterId;
            item.Deadline = dto.Deadline;
            item.Kpi = dto.Kpi;
            item.Notes = dto.Notes;

            if (Enum.TryParse<WorkItemStatus>(dto.Status, out var statusEnum))
            {
                item.Status = statusEnum;
            }

            _unitOfWork.Repository<WorkPlanItem>().Update(item);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new { message = "Cập nhật đầu việc thành công." });
        }

        [HttpDelete("item/{itemId}")]
        public async Task<IActionResult> DeleteItem(Guid itemId)
        {
            var item = await _unitOfWork.Repository<WorkPlanItem>()
                .Query(wi => wi.Id == itemId)
                .Include(wi => wi.WeeklyWorkPlan)
                .FirstOrDefaultAsync();

            if (item == null) return NotFound("Không tìm thấy đầu việc.");

            if (CurrentUserRole == "Employee" && item.WeeklyWorkPlan!.EmployeeId != CurrentUserId)
            {
                return Forbid("Bạn không có quyền xóa đầu việc này.");
            }

            _unitOfWork.Repository<WorkPlanItem>().Delete(item);
            await _unitOfWork.SaveChangesAsync();
            return Ok(new { message = "Xóa đầu việc thành công." });
        }

        [Authorize(Roles = "Admin,Manager")]
        [HttpPut("{id}/feedback")]
        public async Task<IActionResult> AddFeedback(Guid id, [FromBody] FeedbackDto dto)
        {
            var plan = await _unitOfWork.Repository<WeeklyWorkPlan>().GetByIdAsync(id);
            if (plan == null) return NotFound("Không tìm thấy kế hoạch.");

            plan.AdminFeedback = dto.Feedback;
            _unitOfWork.Repository<WeeklyWorkPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();
            return Ok();
        }

        private async Task<WeeklyWorkPlanDto> MapToDtoAsync(WeeklyWorkPlan plan)
        {
            var dto = new WeeklyWorkPlanDto
            {
                Id = plan.Id,
                EmployeeId = plan.EmployeeId,
                EmployeeName = plan.Employee?.FullName ?? string.Empty,
                WeekNumber = plan.WeekNumber,
                Year = plan.Year,
                Target = plan.Target,
                Notes = plan.Notes,
                
                TargetNew = plan.TargetNew,
                TargetContacted = plan.TargetContacted,
                TargetConsulting = plan.TargetConsulting,
                TargetMeeting = plan.TargetMeeting,
                TargetSigned = plan.TargetSigned,

                EvalNew = plan.EvalNew,
                EvalContacted = plan.EvalContacted,
                EvalConsulting = plan.EvalConsulting,
                EvalMeeting = plan.EvalMeeting,
                EvalSigned = plan.EvalSigned,

                FailureReasonAnalysis = plan.FailureReasonAnalysis,
                AdminFeedback = plan.AdminFeedback,

                CreatedAt = plan.CreatedAt,
                WorkPlanItems = plan.WorkPlanItems.Select(wi => new WorkPlanItemDto
                {
                    Id = wi.Id,
                    WeeklyWorkPlanId = wi.WeeklyWorkPlanId,
                    TaskName = wi.TaskName,
                    ActionPlan = wi.ActionPlan,
                    SupporterId = wi.SupporterId,
                    SupporterName = wi.Supporter?.FullName,
                    Deadline = wi.Deadline,
                    Kpi = wi.Kpi,
                    Status = wi.Status.ToString(),
                    Notes = wi.Notes
                }).ToList()
            };

            // Calculate Actuals
            var (start, end) = GetWeekDateRange(plan.Year, plan.WeekNumber);
            var activeLeads = await _unitOfWork.Repository<Lead>()
                .Query(l => l.OwnerId == plan.EmployeeId && 
                    ((l.NewAt.HasValue && l.NewAt.Value >= start && l.NewAt.Value <= end) ||
                     (l.ContactedAt.HasValue && l.ContactedAt.Value >= start && l.ContactedAt.Value <= end) ||
                     (l.ConsultingAt.HasValue && l.ConsultingAt.Value >= start && l.ConsultingAt.Value <= end) ||
                     (l.MeetingAt.HasValue && l.MeetingAt.Value >= start && l.MeetingAt.Value <= end) ||
                     (l.SignedAt.HasValue && l.SignedAt.Value >= start && l.SignedAt.Value <= end)))
                .ToListAsync();

            dto.ActualNew = activeLeads.Count(l => l.NewAt.HasValue && l.NewAt.Value >= start && l.NewAt.Value <= end);
            dto.ActualContacted = activeLeads.Count(l => l.ContactedAt.HasValue && l.ContactedAt.Value >= start && l.ContactedAt.Value <= end);
            dto.ActualConsulting = activeLeads.Count(l => l.ConsultingAt.HasValue && l.ConsultingAt.Value >= start && l.ConsultingAt.Value <= end);
            dto.ActualMeeting = activeLeads.Count(l => l.MeetingAt.HasValue && l.MeetingAt.Value >= start && l.MeetingAt.Value <= end);
            dto.ActualSigned = activeLeads.Count(l => l.SignedAt.HasValue && l.SignedAt.Value >= start && l.SignedAt.Value <= end);

            return dto;
        }

        private (DateTime start, DateTime end) GetWeekDateRange(int year, int weekOfYear)
        {
            var jan1 = new DateTime(year, 1, 1);
            int daysOffset = DayOfWeek.Thursday - jan1.DayOfWeek;
            DateTime firstThursday = jan1.AddDays(daysOffset);
            var cal = System.Globalization.CultureInfo.InvariantCulture.Calendar;
            int firstWeek = cal.GetWeekOfYear(firstThursday, System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
            var weekNum = weekOfYear;
            if (firstWeek == 1) weekNum -= 1;
            var result = firstThursday.AddDays(weekNum * 7);
            var startOfWeek = result.AddDays(-3); // Monday
            var endOfWeek = startOfWeek.AddDays(7).AddTicks(-1);
            return (DateTime.SpecifyKind(startOfWeek, DateTimeKind.Utc), DateTime.SpecifyKind(endOfWeek, DateTimeKind.Utc));
        }
    }
}
