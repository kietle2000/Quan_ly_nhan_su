using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Quan_ly_nhan_su.Application.Interfaces;

namespace Quan_ly_nhan_su.Infrastructure.Files
{
    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _webHostEnvironment;

        public FileService(IWebHostEnvironment webHostEnvironment)
        {
            _webHostEnvironment = webHostEnvironment;
        }

        public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string subFolder)
        {
            // Root path of web application (wwwroot)
            string wwwRootPath = _webHostEnvironment.WebRootPath;
            if (string.IsNullOrEmpty(wwwRootPath))
            {
                // Fallback if WebRootPath is null (in some test or console host environments)
                wwwRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            string uploadFolder = Path.Combine(wwwRootPath, "uploads", subFolder);
            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            // Create unique file name
            string uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
            string filePath = Path.Combine(uploadFolder, uniqueFileName);

            using (var localStream = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(localStream);
            }

            // Return relative path for web access
            return $"/uploads/{subFolder}/{uniqueFileName}";
        }

        public void DeleteFile(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return;

            string wwwRootPath = _webHostEnvironment.WebRootPath;
            if (string.IsNullOrEmpty(wwwRootPath))
            {
                wwwRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            // Normalize path separators
            string normalizedPath = relativePath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
            string fullPath = Path.Combine(wwwRootPath, normalizedPath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
    }
}
