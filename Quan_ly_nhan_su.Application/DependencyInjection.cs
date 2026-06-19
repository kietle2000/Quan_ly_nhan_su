using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Quan_ly_nhan_su.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // Register all FluentValidation validators in this assembly
            services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

            return services;
        }
    }
}
