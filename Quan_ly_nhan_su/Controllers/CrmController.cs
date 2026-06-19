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
    [Route("api/crm")]
    public class CrmController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public CrmController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet("lead")]
        public async Task<IActionResult> GetLeads([FromQuery] string? status, [FromQuery] Guid? ownerId)
        {
            var query = _unitOfWork.Repository<Lead>().Query()
                .Include(l => l.Owner)
                .OrderByDescending(l => l.CreatedAt)
                .AsQueryable();

            if (CurrentUserRole == "Employee")
            {
                query = query.Where(l => l.OwnerId == CurrentUserId);
            }
            else if (CurrentUserRole == "Manager")
            {
                var manager = await _unitOfWork.Repository<Employee>().GetByIdAsync(CurrentUserId);
                if (manager != null && manager.DepartmentId != null)
                {
                    query = query.Where(l => l.Owner == null || l.Owner.DepartmentId == manager.DepartmentId);
                }
            }

            if (CurrentUserRole != "Employee" && ownerId.HasValue)
            {
                query = query.Where(l => l.OwnerId == ownerId.Value);
            }

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<LeadStatus>(status, true, out var statusEnum))
            {
                query = query.Where(l => l.Status == statusEnum);
            }

            var leads = await query.ToListAsync();
            return Ok(leads.Select(MapToDto));
        }

        [HttpGet("lead/{id}")]
        public async Task<IActionResult> GetLeadById(Guid id)
        {
            var lead = await _unitOfWork.Repository<Lead>().Query(l => l.Id == id)
                .Include(l => l.Owner)
                .Include(l => l.ActivityLogs)
                    .ThenInclude(al => al.Employee)
                .FirstOrDefaultAsync();

            if (lead == null) return NotFound("Không tìm thấy khách hàng tiềm năng.");

            // Security Check
            if (CurrentUserRole == "Employee" && lead.OwnerId != CurrentUserId)
            {
                return Forbid("Bạn không có quyền truy cập khách hàng này.");
            }

            return Ok(new LeadDto
            {
                Id = lead.Id,
                Name = lead.Name,
                Phone = lead.Phone,
                FacebookUrl = lead.FacebookUrl,
                Source = lead.Source,
                OwnerId = lead.OwnerId,
                OwnerName = lead.Owner?.FullName,
                Status = lead.Status.ToString(),
                Revenue = lead.Revenue,
                ContractFile = lead.ContractFile,
                FailureReason = lead.FailureReason,
                Notes = lead.Notes,
                CreatedAt = lead.CreatedAt,
                UpdatedAt = lead.UpdatedAt,
                NewAt = lead.NewAt,
                ContactedAt = lead.ContactedAt,
                ConsultingAt = lead.ConsultingAt,
                MeetingAt = lead.MeetingAt,
                SignedAt = lead.SignedAt,
                ActivityLogs = lead.ActivityLogs.OrderByDescending(al => al.ActivityDate).Select(al => new LeadActivityLogDto
                {
                    Id = al.Id,
                    LeadId = al.LeadId,
                    EmployeeId = al.EmployeeId,
                    EmployeeName = al.Employee?.FullName ?? string.Empty,
                    Content = al.Content,
                    ActivityDate = al.ActivityDate,
                    NextFollowUpDate = al.NextFollowUpDate
                }).ToList()
            });
        }

        [HttpPost("lead")]
        public async Task<IActionResult> CreateLead([FromBody] CreateLeadDto dto)
        {
            var lead = new Lead
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Phone = dto.Phone,
                FacebookUrl = dto.FacebookUrl,
                Source = dto.Source,
                Notes = dto.Notes,
                OwnerId = CurrentUserRole == "Employee" ? CurrentUserId : dto.OwnerId,
                Status = LeadStatus.New,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Lead>().AddAsync(lead);
            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLeadById), new { id = lead.Id }, MapToDto(lead));
        }

        [HttpPut("lead/{id}")]
        public async Task<IActionResult> UpdateLead(Guid id, [FromBody] UpdateLeadDto dto)
        {
            var lead = await _unitOfWork.Repository<Lead>().GetByIdAsync(id);
            if (lead == null) return NotFound("Không tìm thấy khách hàng tiềm năng.");

            if (CurrentUserRole == "Employee" && lead.OwnerId != CurrentUserId)
            {
                return Forbid("Bạn không có quyền chỉnh sửa khách hàng này.");
            }

            if (!string.IsNullOrEmpty(dto.Name)) lead.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.Phone)) lead.Phone = dto.Phone;
            if (dto.FacebookUrl != null) lead.FacebookUrl = dto.FacebookUrl;
            if (dto.Source != null) lead.Source = dto.Source;
            if (dto.Notes != null) lead.Notes = dto.Notes;
            
            if (CurrentUserRole != "Employee" && dto.OwnerId.HasValue)
            {
                lead.OwnerId = dto.OwnerId;
            }

            bool wasNotSigned = lead.Status != LeadStatus.Signed;
            bool isNowSigned = false;

            if (Enum.TryParse<LeadStatus>(dto.Status, true, out var statusEnum))
            {
                lead.Status = statusEnum;
                isNowSigned = statusEnum == LeadStatus.Signed;
            }

            lead.Revenue = dto.Revenue;
            lead.ContractFile = dto.ContractFile;
            lead.FailureReason = dto.FailureReason;

            // Update Funnel Timestamps
            if (dto.NewAt.HasValue && !lead.NewAt.HasValue) lead.NewAt = dto.NewAt;
            else if (!dto.NewAt.HasValue) lead.NewAt = null;

            if (dto.ContactedAt.HasValue && !lead.ContactedAt.HasValue) lead.ContactedAt = dto.ContactedAt;
            else if (!dto.ContactedAt.HasValue) lead.ContactedAt = null;

            if (dto.ConsultingAt.HasValue && !lead.ConsultingAt.HasValue) lead.ConsultingAt = dto.ConsultingAt;
            else if (!dto.ConsultingAt.HasValue) lead.ConsultingAt = null;

            if (dto.MeetingAt.HasValue && !lead.MeetingAt.HasValue) lead.MeetingAt = dto.MeetingAt;
            else if (!dto.MeetingAt.HasValue) lead.MeetingAt = null;

            if (dto.SignedAt.HasValue && !lead.SignedAt.HasValue) lead.SignedAt = dto.SignedAt;
            else if (!dto.SignedAt.HasValue) lead.SignedAt = null;

            lead.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Repository<Lead>().Update(lead);

            // Auto-update KPI
            if (wasNotSigned && isNowSigned && lead.OwnerId.HasValue)
            {
                var now = DateTime.UtcNow;
                var kpis = await _unitOfWork.Repository<Kpi>()
                    .Query(k => k.EmployeeId == lead.OwnerId.Value && k.StartDate <= now && k.EndDate >= now)
                    .ToListAsync();
                
                var revenueKpi = kpis.FirstOrDefault(k => k.TargetName.ToLower().Contains("doanh thu") || k.TargetName.ToLower().Contains("doanh số"));
                if (revenueKpi != null && dto.Revenue.HasValue)
                {
                    revenueKpi.CurrentValue += (double)dto.Revenue.Value;
                    if (revenueKpi.CurrentValue >= revenueKpi.TargetValue) revenueKpi.Status = "Achieved";
                    _unitOfWork.Repository<Kpi>().Update(revenueKpi);
                }

                var signKpi = kpis.FirstOrDefault(k => k.TargetName.ToLower().Contains("chốt khách") || k.TargetName.ToLower().Contains("hợp đồng"));
                if (signKpi != null)
                {
                    signKpi.CurrentValue += 1;
                    if (signKpi.CurrentValue >= signKpi.TargetValue) signKpi.Status = "Achieved";
                    _unitOfWork.Repository<Kpi>().Update(signKpi);
                }
            }

            await _unitOfWork.SaveChangesAsync();

            return Ok(MapToDto(lead));
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("lead/{id}")]
        public async Task<IActionResult> DeleteLead(Guid id)
        {
            await _unitOfWork.Repository<LeadActivityLog>().Query().Where(a => a.LeadId == id).ExecuteDeleteAsync();
            var deletedCount = await _unitOfWork.Repository<Lead>().Query().Where(l => l.Id == id).ExecuteDeleteAsync();
            
            if (deletedCount == 0) return NotFound("Không tìm thấy khách hàng.");
            
            return Ok(new { message = "Đã xóa khách hàng thành công." });
        }

        [HttpPost("lead/{id}/activity")]
        public async Task<IActionResult> CreateActivity(Guid id, [FromBody] CreateLeadActivityLogDto dto)
        {
            var lead = await _unitOfWork.Repository<Lead>().GetByIdAsync(id);
            if (lead == null) return NotFound("Không tìm thấy khách hàng tiềm năng.");

            if (CurrentUserRole == "Employee" && lead.OwnerId != CurrentUserId)
            {
                return Forbid("Bạn không có quyền chăm sóc khách hàng này.");
            }

            var log = new LeadActivityLog
            {
                Id = Guid.NewGuid(),
                LeadId = id,
                EmployeeId = CurrentUserId,
                Content = dto.Content,
                ActivityDate = DateTime.UtcNow,
                NextFollowUpDate = dto.NextFollowUpDate
            };

            await _unitOfWork.Repository<LeadActivityLog>().AddAsync(log);
            
            // Auto update lead stage if contacted
            if (lead.Status == LeadStatus.New)
            {
                lead.Status = LeadStatus.Contacted;
                _unitOfWork.Repository<Lead>().Update(lead);
            }

            await _unitOfWork.SaveChangesAsync();
            return Ok(new { message = "Lưu nhật ký chăm sóc thành công." });
        }

        private static LeadDto MapToDto(Lead lead)
        {
            return new LeadDto
            {
                Id = lead.Id,
                Name = lead.Name,
                Phone = lead.Phone,
                FacebookUrl = lead.FacebookUrl,
                Source = lead.Source,
                OwnerId = lead.OwnerId,
                OwnerName = lead.Owner?.FullName,
                Status = lead.Status.ToString(),
                Revenue = lead.Revenue,
                ContractFile = lead.ContractFile,
                FailureReason = lead.FailureReason,
                Notes = lead.Notes,
                CreatedAt = lead.CreatedAt,
                UpdatedAt = lead.UpdatedAt,
                NewAt = lead.NewAt,
                ContactedAt = lead.ContactedAt,
                ConsultingAt = lead.ConsultingAt,
                MeetingAt = lead.MeetingAt,
                SignedAt = lead.SignedAt
            };
        }

        [Authorize(Roles = "Admin,Manager")]
        [HttpPost("import")]
        public async Task<IActionResult> ImportLeads([FromBody] ImportLeadsRequestDto dto)
        {
            if (dto.Leads == null || !dto.Leads.Any()) return BadRequest("Danh sách khách hàng trống.");
            if (dto.EmployeeIds == null || !dto.EmployeeIds.Any()) return BadRequest("Chưa chọn nhân viên nhận khách hàng.");

            var existingPhones = await _unitOfWork.Repository<Lead>().Query()
                .Select(l => l.Phone)
                .ToListAsync();
            
            var existingPhoneSet = new HashSet<string>(existingPhones);
            var importedPhoneSet = new HashSet<string>();

            var newLeads = new List<Lead>();
            int empCount = dto.EmployeeIds.Count;
            int importCount = 0;
            
            for (int i = 0; i < dto.Leads.Count; i++)
            {
                var leadData = dto.Leads[i];
                if (string.IsNullOrWhiteSpace(leadData.Phone)) continue;
                
                // Bỏ qua nếu trùng SĐT trong Database hoặc trùng trong cùng file Excel
                if (existingPhoneSet.Contains(leadData.Phone) || importedPhoneSet.Contains(leadData.Phone))
                {
                    continue; 
                }
                importedPhoneSet.Add(leadData.Phone);

                var assignedEmpId = dto.EmployeeIds[importCount % empCount];
                importCount++;

                var lead = new Lead
                {
                    Id = Guid.NewGuid(),
                    Name = leadData.Name,
                    Phone = leadData.Phone,
                    FacebookUrl = leadData.FacebookUrl,
                    Source = leadData.Source,
                    Notes = leadData.Notes,
                    OwnerId = assignedEmpId,
                    Status = LeadStatus.New,
                    NewAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };

                // Add activity log
                lead.ActivityLogs.Add(new LeadActivityLog
                {
                    Id = Guid.NewGuid(),
                    Content = "Khách hàng được import từ Excel và phân bổ tự động",
                    ActivityDate = DateTime.UtcNow,
                    EmployeeId = CurrentUserId
                });

                newLeads.Add(lead);
            }

            foreach (var lead in newLeads)
            {
                await _unitOfWork.Repository<Lead>().AddAsync(lead);
            }

            await _unitOfWork.SaveChangesAsync();

            return Ok(new { message = $"Đã nhập và phân bổ thành công {newLeads.Count} khách hàng mới (đã tự động bỏ qua các số điện thoại trùng lặp)." });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("delete-all")]
        public async Task<IActionResult> DeleteAllLeads()
        {
            await _unitOfWork.Repository<LeadActivityLog>().Query().ExecuteDeleteAsync();
            await _unitOfWork.Repository<Lead>().Query().ExecuteDeleteAsync();
            
            return Ok(new { message = "Đã xóa toàn bộ khách hàng để reset dữ liệu." });
        }
    }
}
