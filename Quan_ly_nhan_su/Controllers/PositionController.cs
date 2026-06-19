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
    [Route("api/position")]
    public class PositionController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public PositionController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var positions = await _unitOfWork.Repository<Position>().GetAllAsync();
            var dtos = positions.Select(p => new PositionDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description
            });
            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var p = await _unitOfWork.Repository<Position>().GetByIdAsync(id);
            if (p == null) return NotFound("Không tìm thấy chức vụ.");
            
            return Ok(new PositionDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePositionDto dto)
        {
            var p = new Position
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description
            };

            await _unitOfWork.Repository<Position>().AddAsync(p);
            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = p.Id }, dto);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreatePositionDto dto)
        {
            var p = await _unitOfWork.Repository<Position>().GetByIdAsync(id);
            if (p == null) return NotFound("Không tìm thấy chức vụ.");

            p.Name = dto.Name;
            p.Description = dto.Description;

            _unitOfWork.Repository<Position>().Update(p);
            await _unitOfWork.SaveChangesAsync();
            return Ok(dto);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var p = await _unitOfWork.Repository<Position>().GetByIdAsync(id);
            if (p == null) return NotFound("Không tìm thấy chức vụ.");

            _unitOfWork.Repository<Position>().Delete(p);
            await _unitOfWork.SaveChangesAsync();
            return Ok(new { message = "Xóa chức vụ thành công." });
        }
    }
}
