using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Quan_ly_nhan_su.Application.DTOs;
using Quan_ly_nhan_su.Application.Exceptions;
using Quan_ly_nhan_su.Application.Interfaces;
using Quan_ly_nhan_su.Domain.Entities;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Infrastructure.Auth
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public AuthService(IUnitOfWork unitOfWork, IConfiguration configuration)
        {
            _unitOfWork = unitOfWork;
            _configuration = configuration;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var employee = await _unitOfWork.Repository<Employee>()
                .Query(x => x.Email == request.Email)
                .Include(x => x.Department)
                .Include(x => x.Position)
                .FirstOrDefaultAsync();

            if (employee == null || !employee.IsActive || !BCrypt.Net.BCrypt.Verify(request.Password, employee.PasswordHash))
            {
                throw new BadRequestException("Tài khoản hoặc mật khẩu không chính xác.");
            }

            var accessToken = GenerateAccessToken(employee);
            var refreshToken = GenerateRefreshToken();

            employee.RefreshToken = refreshToken;
            employee.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            _unitOfWork.Repository<Employee>().Update(employee);
            await _unitOfWork.SaveChangesAsync();

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = MapToDto(employee)
            };
        }

        public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var principal = GetPrincipalFromExpiredToken(request.AccessToken);
            if (principal == null)
            {
                throw new BadRequestException("Access Token không hợp lệ.");
            }

            var email = principal.FindFirst(ClaimTypes.Email)?.Value;
            var employee = await _unitOfWork.Repository<Employee>()
                .Query(x => x.Email == email)
                .Include(x => x.Department)
                .Include(x => x.Position)
                .FirstOrDefaultAsync();

            if (employee == null || employee.RefreshToken != request.RefreshToken || employee.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                throw new BadRequestException("Refresh Token không hợp lệ hoặc đã hết hạn.");
            }

            var newAccessToken = GenerateAccessToken(employee);
            var newRefreshToken = GenerateRefreshToken();

            employee.RefreshToken = newRefreshToken;
            employee.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            _unitOfWork.Repository<Employee>().Update(employee);
            await _unitOfWork.SaveChangesAsync();

            return new LoginResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                User = MapToDto(employee)
            };
        }

        public async Task<EmployeeDto> RegisterAsync(RegisterRequest request)
        {
            var emailExists = await _unitOfWork.Repository<Employee>().AnyAsync(x => x.Email == request.Email);
            if (emailExists)
            {
                throw new BadRequestException("Email đã tồn tại trên hệ thống.");
            }

            if (!Enum.TryParse<UserRole>(request.Role, out var roleEnum))
            {
                roleEnum = UserRole.Employee;
            }

            var employee = new Employee
            {
                Id = Guid.NewGuid(),
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = roleEnum,
                DepartmentId = request.DepartmentId,
                PositionId = request.PositionId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Employee>().AddAsync(employee);
            await _unitOfWork.SaveChangesAsync();

            // Load relations for response DTO
            var createdEmployee = await _unitOfWork.Repository<Employee>()
                .Query(x => x.Id == employee.Id)
                .Include(x => x.Department)
                .Include(x => x.Position)
                .FirstAsync();

            return MapToDto(createdEmployee);
        }

        public async Task<bool> ChangePasswordAsync(Guid employeeId, ChangePasswordRequest request)
        {
            var employee = await _unitOfWork.Repository<Employee>().GetByIdAsync(employeeId);
            if (employee == null)
            {
                throw new NotFoundException("Nhân viên", employeeId);
            }

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, employee.PasswordHash))
            {
                throw new BadRequestException("Mật khẩu cũ không chính xác.");
            }

            employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            _unitOfWork.Repository<Employee>().Update(employee);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        private string GenerateAccessToken(Employee employee)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, employee.Id.ToString()),
                new Claim(ClaimTypes.Name, employee.FullName),
                new Claim(ClaimTypes.Email, employee.Email),
                new Claim(ClaimTypes.Role, employee.Role.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"] ?? "nhan_phu_study_abroad_secret_key_1234567890"));
            
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "NhanPhuHrm",
                audience: _configuration["Jwt:Audience"] ?? "NhanPhuHrmUsers",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:DurationInMinutes"] ?? "60")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"] ?? "NhanPhuHrmUsers",
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"] ?? "NhanPhuHrm",
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                    _configuration["Jwt:Key"] ?? "nhan_phu_study_abroad_secret_key_1234567890")),
                ValidateLifetime = false // We need to validate token even if expired
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            
            if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }

        private EmployeeDto MapToDto(Employee employee)
        {
            return new EmployeeDto
            {
                Id = employee.Id,
                FullName = employee.FullName,
                Email = employee.Email,
                Phone = employee.Phone,
                Role = employee.Role.ToString(),
                DepartmentId = employee.DepartmentId,
                DepartmentName = employee.Department?.Name,
                PositionId = employee.PositionId,
                PositionName = employee.Position?.Name,
                IsActive = employee.IsActive,
                CreatedAt = employee.CreatedAt
            };
        }
    }
}
