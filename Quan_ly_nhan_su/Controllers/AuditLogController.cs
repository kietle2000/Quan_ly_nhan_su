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
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/auditlog")]
    public class AuditLogController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public AuditLogController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAuditLogs([FromQuery] string? tableName, [FromQuery] string? action)
        {
            var query = _unitOfWork.Repository<AuditLog>().Query()
                .Include(a => a.Employee)
                .OrderByDescending(a => a.Timestamp)
                .AsQueryable();

            if (!string.IsNullOrEmpty(tableName))
            {
                query = query.Where(a => a.TableName.Contains(tableName));
            }

            if (!string.IsNullOrEmpty(action))
            {
                query = query.Where(a => a.Action.Contains(action));
            }

            var logs = await query.Take(100).ToListAsync();
            
            var dtos = logs.Select(a => new AuditLogDto
            {
                Id = a.Id,
                EmployeeId = a.EmployeeId,
                EmployeeName = a.Employee?.FullName,
                Action = a.Action,
                TableName = a.TableName,
                RecordId = a.RecordId,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                Timestamp = a.Timestamp
            });

            return Ok(dtos);
        }
    }
}
