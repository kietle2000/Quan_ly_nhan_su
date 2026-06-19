using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quan_ly_nhan_su.Application.DTOs;
using Quan_ly_nhan_su.Application.Interfaces;
using Quan_ly_nhan_su.Domain.Entities;

namespace Quan_ly_nhan_su.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/report")]
    public class ReportController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileService _fileService;

        public ReportController(IUnitOfWork unitOfWork, IFileService fileService)
        {
            _unitOfWork = unitOfWork;
            _fileService = fileService;
        }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet("daily")]
        public async Task<IActionResult> GetDailyReports([FromQuery] DateTime? date, [FromQuery] Guid? employeeId)
        {
            var query = _unitOfWork.Repository<DailyReport>().Query()
                .Include(r => r.Employee)
                .Include(r => r.Attachments)
                .OrderByDescending(r => r.Date)
                .AsQueryable();

            if (CurrentUserRole == "Employee")
            {
                query = query.Where(r => r.EmployeeId == CurrentUserId);
            }
            else if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager != null && manager.DepartmentId != null)
                {
                    query = query.Where(r => r.Employee!.DepartmentId == manager.DepartmentId);
                }
            }
            else // Admin
            {
                if (employeeId.HasValue)
                {
                    query = query.Where(r => r.EmployeeId == employeeId.Value);
                }
            }

            if (date.HasValue)
            {
                var searchDate = date.Value.Date;
                query = query.Where(r => r.Date.Date == searchDate);
            }

            var reports = await query.ToListAsync();
            var dtos = new List<DailyReportDto>();
            foreach(var r in reports) dtos.Add(await MapDailyReportToDtoAsync(r));
            return Ok(dtos);
        }

        [HttpPost("daily")]
        public async Task<IActionResult> CreateDailyReport([FromForm] CreateDailyReportDto dto, [FromForm] List<IFormFile> files)
        {
            var report = new DailyReport
            {
                Id = Guid.NewGuid(),
                EmployeeId = CurrentUserId,
                Date = dto.Date,
                Content = dto.Content,
                ProgressPercentage = dto.ProgressPercentage,
                
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

                FailureReasonAnalysis = dto.FailureReasonAnalysis,

                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<DailyReport>().AddAsync(report);

            if (files != null && files.Count > 0)
            {
                foreach (var file in files)
                {
                    using var stream = file.OpenReadStream();
                    string relativePath = await _fileService.SaveFileAsync(stream, file.FileName, "reports");
                    
                    var attachment = new ReportAttachment
                    {
                        Id = Guid.NewGuid(),
                        DailyReportId = report.Id,
                        FileName = file.FileName,
                        FilePath = relativePath,
                        FileType = file.ContentType,
                        UploadedAt = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<ReportAttachment>().AddAsync(attachment);
                }
            }

            await _unitOfWork.SaveChangesAsync();
            return Ok(new { message = "Gửi báo cáo ngày thành công." });
        }

        [HttpGet("weekly")]
        public async Task<IActionResult> GetWeeklyReports([FromQuery] int? week, [FromQuery] int? year, [FromQuery] Guid? employeeId)
        {
            var query = _unitOfWork.Repository<WeeklyReport>().Query()
                .Include(r => r.Employee)
                .Include(r => r.Attachments)
                .OrderByDescending(r => r.Year).ThenByDescending(r => r.WeekNumber)
                .AsQueryable();

            if (CurrentUserRole == "Employee")
            {
                query = query.Where(r => r.EmployeeId == CurrentUserId);
            }
            else if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager != null && manager.DepartmentId != null)
                {
                    query = query.Where(r => r.Employee!.DepartmentId == manager.DepartmentId);
                }
            }
            else // Admin
            {
                if (employeeId.HasValue)
                {
                    query = query.Where(r => r.EmployeeId == employeeId.Value);
                }
            }

            if (week.HasValue) query = query.Where(r => r.WeekNumber == week.Value);
            if (year.HasValue) query = query.Where(r => r.Year == year.Value);

            var reports = await query.ToListAsync();
            return Ok(reports.Select(r => new WeeklyReportDto
            {
                Id = r.Id,
                EmployeeId = r.EmployeeId,
                EmployeeName = r.Employee?.FullName ?? string.Empty,
                WeekNumber = r.WeekNumber,
                Year = r.Year,
                Content = r.Content,
                NextWeekPlan = r.NextWeekPlan,
                AdminFeedback = r.AdminFeedback,
                CreatedAt = r.CreatedAt,
                Attachments = r.Attachments.Select(MapAttachment).ToList()
            }));
        }

        [HttpPost("weekly")]
        public async Task<IActionResult> CreateWeeklyReport([FromForm] CreateWeeklyReportDto dto, [FromForm] List<IFormFile> files)
        {
            var report = new WeeklyReport
            {
                Id = Guid.NewGuid(),
                EmployeeId = CurrentUserId,
                WeekNumber = dto.WeekNumber,
                Year = dto.Year,
                Content = dto.Content,
                NextWeekPlan = dto.NextWeekPlan,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<WeeklyReport>().AddAsync(report);

            if (files != null && files.Count > 0)
            {
                foreach (var file in files)
                {
                    using var stream = file.OpenReadStream();
                    string relativePath = await _fileService.SaveFileAsync(stream, file.FileName, "reports");

                    var attachment = new ReportAttachment
                    {
                        Id = Guid.NewGuid(),
                        WeeklyReportId = report.Id,
                        FileName = file.FileName,
                        FilePath = relativePath,
                        FileType = file.ContentType,
                        UploadedAt = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<ReportAttachment>().AddAsync(attachment);
                }
            }

            await _unitOfWork.SaveChangesAsync();
            return Ok(new { message = "Gửi báo cáo tuần thành công." });
        }

        private static ReportAttachmentDto MapAttachment(ReportAttachment a)
        {
            return new ReportAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FilePath = a.FilePath,
                FileType = a.FileType,
                UploadedAt = a.UploadedAt
            };
        }

        private async Task<DailyReportDto> MapDailyReportToDtoAsync(DailyReport r)
        {
            var dto = new DailyReportDto
            {
                Id = r.Id,
                EmployeeId = r.EmployeeId,
                EmployeeName = r.Employee?.FullName ?? string.Empty,
                Date = r.Date,
                Content = r.Content,
                ProgressPercentage = r.ProgressPercentage,
                
                TargetNew = r.TargetNew,
                TargetContacted = r.TargetContacted,
                TargetConsulting = r.TargetConsulting,
                TargetMeeting = r.TargetMeeting,
                TargetSigned = r.TargetSigned,

                EvalNew = r.EvalNew,
                EvalContacted = r.EvalContacted,
                EvalConsulting = r.EvalConsulting,
                EvalMeeting = r.EvalMeeting,
                EvalSigned = r.EvalSigned,

                FailureReasonAnalysis = r.FailureReasonAnalysis,
                AdminFeedback = r.AdminFeedback,

                CreatedAt = r.CreatedAt,
                Attachments = r.Attachments.Select(MapAttachment).ToList()
            };

            var searchDate = r.Date.Date;
            var activeLeads = await _unitOfWork.Repository<Lead>()
                .Query(l => l.OwnerId == r.EmployeeId && 
                    ((l.NewAt.HasValue && l.NewAt.Value.Date == searchDate) ||
                     (l.ContactedAt.HasValue && l.ContactedAt.Value.Date == searchDate) ||
                     (l.ConsultingAt.HasValue && l.ConsultingAt.Value.Date == searchDate) ||
                     (l.MeetingAt.HasValue && l.MeetingAt.Value.Date == searchDate) ||
                     (l.SignedAt.HasValue && l.SignedAt.Value.Date == searchDate)))
                .ToListAsync();

            dto.ActualNew = activeLeads.Count(l => l.NewAt.HasValue && l.NewAt.Value.Date == searchDate);
            dto.ActualContacted = activeLeads.Count(l => l.ContactedAt.HasValue && l.ContactedAt.Value.Date == searchDate);
            dto.ActualConsulting = activeLeads.Count(l => l.ConsultingAt.HasValue && l.ConsultingAt.Value.Date == searchDate);
            dto.ActualMeeting = activeLeads.Count(l => l.MeetingAt.HasValue && l.MeetingAt.Value.Date == searchDate);
            dto.ActualSigned = activeLeads.Count(l => l.SignedAt.HasValue && l.SignedAt.Value.Date == searchDate);

            return dto;
        }

        [Authorize(Roles = "Admin,Manager")]
        [HttpPut("daily/{id}/feedback")]
        public async Task<IActionResult> AddDailyFeedback(Guid id, [FromBody] FeedbackDto dto)
        {
            var report = await _unitOfWork.Repository<DailyReport>().GetByIdAsync(id);
            if (report == null) return NotFound("Không tìm thấy báo cáo.");
            
            report.AdminFeedback = dto.Feedback;
            _unitOfWork.Repository<DailyReport>().Update(report);
            await _unitOfWork.SaveChangesAsync();
            return Ok();
        }

        [Authorize(Roles = "Admin,Manager")]
        [HttpPut("weekly/{id}/feedback")]
        public async Task<IActionResult> AddWeeklyFeedback(Guid id, [FromBody] FeedbackDto dto)
        {
            var report = await _unitOfWork.Repository<WeeklyReport>().GetByIdAsync(id);
            if (report == null) return NotFound("Không tìm thấy báo cáo.");
            
            report.AdminFeedback = dto.Feedback;
            _unitOfWork.Repository<WeeklyReport>().Update(report);
            await _unitOfWork.SaveChangesAsync();
            return Ok();
        }
    }
}
