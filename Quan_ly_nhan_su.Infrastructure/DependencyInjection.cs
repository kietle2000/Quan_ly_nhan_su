using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Quan_ly_nhan_su.Application.Interfaces;
using Quan_ly_nhan_su.Infrastructure.Auth;
using Quan_ly_nhan_su.Infrastructure.Files;
using Quan_ly_nhan_su.Infrastructure.Persistence;
using Quan_ly_nhan_su.Infrastructure.Repositories;
using Quan_ly_nhan_su.Infrastructure.Services;

namespace Quan_ly_nhan_su.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // Setup ApplicationDbContext with SQL Server
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

            // Register Services
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IFileService, FileService>();
            services.AddScoped<IClassService, ClassService>();

            // Register Background Services
            services.AddHostedService<Services.SmartAlertService>();

            return services;
        }
    }
}
