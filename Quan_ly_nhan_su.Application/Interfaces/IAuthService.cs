using System;
using System.Threading.Tasks;
using Quan_ly_nhan_su.Application.DTOs;

namespace Quan_ly_nhan_su.Application.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request);
        Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request);
        Task<EmployeeDto> RegisterAsync(RegisterRequest request);
        Task<bool> ChangePasswordAsync(Guid employeeId, ChangePasswordRequest request);
    }
}
