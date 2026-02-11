using System.Security.Cryptography;

namespace ReceiptHealth.Services;

public interface IFileStorageService
{
    Task<(string filePath, string sha256Hash)> SaveFileAsync(IFormFile file, string? subfolder = null);
    Task<bool> FileExistsBySha256Async(string sha256Hash);
    string GetFilePath(string fileName, string? subfolder = null);
    Task<byte[]> ReadFileAsync(string filePath);
}

public class FileStorageService : IFileStorageService
{
    private readonly string _storageRoot;
    private readonly ILogger<FileStorageService> _logger;

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        _storageRoot = configuration["ReceiptHealth:StorageRoot"] ?? "./storage";
        _logger = logger;
        
        // Ensure storage directory exists
        if (!Directory.Exists(_storageRoot))
        {
            Directory.CreateDirectory(_storageRoot);
            _logger.LogInformation("Created storage directory: {StorageRoot}", _storageRoot);
        }
    }

    public async Task<(string filePath, string sha256Hash)> SaveFileAsync(IFormFile file, string? subfolder = null)
    {
        // Compute SHA256 hash
        using var stream = file.OpenReadStream();
        var sha256Hash = await ComputeSha256HashAsync(stream);
        
        // Reset stream position
        stream.Position = 0;
        
        // Create subfolder if specified
        var targetDirectory = _storageRoot;
        if (!string.IsNullOrEmpty(subfolder))
        {
            targetDirectory = Path.Combine(_storageRoot, subfolder);
            if (!Directory.Exists(targetDirectory))
            {
                Directory.CreateDirectory(targetDirectory);
            }
        }
        
        // Generate unique filename using timestamp and original extension
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var extension = Path.GetExtension(file.FileName);
        var safeFileName = $"{timestamp}_{sha256Hash[..8]}{extension}";
        var filePath = Path.Combine(targetDirectory, safeFileName);
        
        // Save file
        using var fileStream = new FileStream(filePath, FileMode.Create);
        await stream.CopyToAsync(fileStream);
        
        _logger.LogInformation("Saved file: {FilePath} (SHA256: {Hash})", filePath, sha256Hash);
        
        return (filePath, sha256Hash);
    }

    public async Task<bool> FileExistsBySha256Async(string sha256Hash)
    {
        // This method would check the database for existing file with same hash
        // For now, return false (will be implemented with repository pattern)
        await Task.CompletedTask;
        return false;
    }

    public string GetFilePath(string fileName, string? subfolder = null)
    {
        var directory = string.IsNullOrEmpty(subfolder) 
            ? _storageRoot 
            : Path.Combine(_storageRoot, subfolder);
        return Path.Combine(directory, fileName);
    }

    public async Task<byte[]> ReadFileAsync(string filePath)
    {
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"File not found: {filePath}");
        }
        
        return await File.ReadAllBytesAsync(filePath);
    }

    private static async Task<string> ComputeSha256HashAsync(Stream stream)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = await sha256.ComputeHashAsync(stream);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
