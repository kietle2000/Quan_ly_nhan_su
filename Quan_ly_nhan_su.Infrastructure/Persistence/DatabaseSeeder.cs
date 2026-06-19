using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Quan_ly_nhan_su.Domain.Entities;
using Quan_ly_nhan_su.Domain.Enums;

namespace Quan_ly_nhan_su.Infrastructure.Persistence
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Apply migrations automatically
            await context.Database.MigrateAsync();

            // 1. Seed Positions
            if (!await context.Positions.AnyAsync())
            {
                var positions = new[]
                {
                    new Position { Id = Guid.NewGuid(), Name = "Giám đốc", Description = "Ban điều hành công ty" },
                    new Position { Id = Guid.NewGuid(), Name = "Trưởng phòng", Description = "Quản lý phòng ban" },
                    new Position { Id = Guid.NewGuid(), Name = "Nhân viên", Description = "Nhân viên thực hiện nghiệp vụ" }
                };
                await context.Positions.AddRangeAsync(positions);
                await context.SaveChangesAsync();
            }

            // 2. Seed Departments
            if (!await context.Departments.AnyAsync())
            {
                var departments = new[]
                {
                    new Department { Id = Guid.NewGuid(), Name = "Phòng Nhân sự", Description = "Hành chính nhân sự và chế độ chính sách" },
                    new Department { Id = Guid.NewGuid(), Name = "Phòng Tuyển sinh", Description = "Tư vấn du học và làm hồ sơ học sinh" },
                    new Department { Id = Guid.NewGuid(), Name = "Phòng Marketing", Description = "Quảng bá thương hiệu và thu hút khách hàng tiềm năng" }
                };
                await context.Departments.AddRangeAsync(departments);
                await context.SaveChangesAsync();
            }

            // 3. Seed Users
            if (!await context.Employees.AnyAsync())
            {
                var hrDept = await context.Departments.FirstAsync(d => d.Name == "Phòng Nhân sự");
                var tsDept = await context.Departments.FirstAsync(d => d.Name == "Phòng Tuyển sinh");

                var gdPos = await context.Positions.FirstAsync(p => p.Name == "Giám đốc");
                var tpPos = await context.Positions.FirstAsync(p => p.Name == "Trưởng phòng");
                var nvPos = await context.Positions.FirstAsync(p => p.Name == "Nhân viên");

                var admin = new Employee
                {
                    Id = Guid.NewGuid(),
                    FullName = "Admin Nhân Phú",
                    Email = "admin@nhanphu.edu.vn",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("adminPassword123"),
                    Phone = "0900000001",
                    Role = UserRole.Admin,
                    DepartmentId = hrDept.Id,
                    PositionId = gdPos.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var manager = new Employee
                {
                    Id = Guid.NewGuid(),
                    FullName = "Manager Tuyển sinh",
                    Email = "manager@nhanphu.edu.vn",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("managerPassword123"),
                    Phone = "0900000002",
                    Role = UserRole.Manager,
                    DepartmentId = tsDept.Id,
                    PositionId = tpPos.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var employee = new Employee
                {
                    Id = Guid.NewGuid(),
                    FullName = "Employee Học vụ",
                    Email = "employee@nhanphu.edu.vn",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("employeePassword123"),
                    Phone = "0900000003",
                    Role = UserRole.Employee,
                    DepartmentId = tsDept.Id,
                    PositionId = nvPos.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await context.Employees.AddRangeAsync(admin, manager, employee);
                await context.SaveChangesAsync();

                // Set manager relation for Department
                tsDept.ManagerId = manager.Id;
                context.Departments.Update(tsDept);
                
                hrDept.ManagerId = admin.Id;
                context.Departments.Update(hrDept);
                
                await context.SaveChangesAsync();
            }
        }
    }
}
