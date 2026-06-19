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
    [Route("api/notification")]
    public class NotificationController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public NotificationController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var notifications = await _unitOfWork.Repository<Notification>()
                .Query(n => n.RecipientId == null || n.RecipientId == CurrentUserId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync();

            var dtos = notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                RecipientId = n.RecipientId,
                Title = n.Title,
                Content = n.Content,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                Link = n.Link
            });

            return Ok(dtos);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] NotificationDto dto)
        {
            if (CurrentUserRole == "Employee")
            {
                return Forbid("Nhân viên không thể tạo thông báo nội bộ.");
            }

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                RecipientId = dto.RecipientId,
                Title = dto.Title,
                Content = dto.Content,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                Link = dto.Link
            };

            await _unitOfWork.Repository<Notification>().AddAsync(notification);
            await _unitOfWork.SaveChangesAsync();
            return Ok(dto);
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var notification = await _unitOfWork.Repository<Notification>().GetByIdAsync(id);
            if (notification == null) return NotFound("Không tìm thấy thông báo.");

            if (notification.RecipientId.HasValue && notification.RecipientId.Value != CurrentUserId)
            {
                return Forbid("Bạn không có quyền sửa đổi thông báo này.");
            }

            notification.IsRead = true;
            _unitOfWork.Repository<Notification>().Update(notification);
            await _unitOfWork.SaveChangesAsync();
            return Ok(new { message = "Đã đánh dấu đã đọc." });
        }
    }
}
