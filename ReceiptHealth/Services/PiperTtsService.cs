using System.Diagnostics;
using System.Text;

namespace ReceiptHealth.Services;

/// <summary>
/// Text-to-Speech service using Piper (local, fast, neural TTS)
/// Download Piper from: https://github.com/rhasspy/piper/releases
/// </summary>
public interface IPiperTtsService
{
    Task<byte[]> GenerateSpeechAsync(string text, string? voice = null, CancellationToken cancellationToken = default);
    bool IsAvailable();
    List<VoiceOption> GetAvailableVoices();
}

public record VoiceOption(string Id, string Name, string Language, string Gender, string Description);

public class PiperTtsService : IPiperTtsService
{
    private readonly ILogger<PiperTtsService> _logger;
    private readonly string _piperPath;
    private readonly string _modelPath;
    private readonly bool _isAvailable;

    public PiperTtsService(ILogger<PiperTtsService> logger, IConfiguration configuration)
    {
        _logger = logger;
        // Use Python script instead of executable
        _piperPath = configuration.GetValue<string>("Piper:PythonExecutable") ?? 
                     "C:/VSCodeProjects/GitHub/copilot-powered-app/.venv/Scripts/python.exe";
        _modelPath = configuration.GetValue<string>("Piper:HelperScript") ?? "./piper_tts_helper.py";

        // Check if Python and helper script are available
        _isAvailable = File.Exists(_piperPath) && File.Exists(_modelPath);
        
        if (_isAvailable)
        {
            _logger.LogInformation("🎵 Piper TTS initialized: Python at {PiperPath} with script {ModelPath}", _piperPath, _modelPath);
        }
        else
        {
            _logger.LogWarning("⚠️ Piper TTS not available. Python: {PythonExists}, Script: {ScriptExists}", 
                File.Exists(_piperPath), File.Exists(_modelPath));
        }
    }

    public bool IsAvailable() => _isAvailable;

    public List<VoiceOption> GetAvailableVoices()
    {
        return new List<VoiceOption>
        {
            new("en-US-AriaNeural", "Aria (US)", "English (US)", "Female", "Friendly, conversational"),
            new("en-US-GuyNeural", "Guy (US)", "English (US)", "Male", "Professional, clear"),
            new("en-US-JennyNeural", "Jenny (US)", "English (US)", "Female", "Warm, customer service"),
            new("en-US-ChristopherNeural", "Christopher (US)", "English (US)", "Male", "Casual, friendly"),
            new("en-GB-SoniaNeural", "Sonia (UK)", "English (UK)", "Female", "British accent"),
            new("en-GB-RyanNeural", "Ryan (UK)", "English (UK)", "Male", "British accent"),
            new("en-AU-NatashaNeural", "Natasha (AU)", "English (AU)", "Female", "Australian accent"),
            new("en-AU-WilliamNeural", "William (AU)", "English (AU)", "Male", "Australian accent")
        };
    }

    public async Task<byte[]> GenerateSpeechAsync(string text, string? voice = null, CancellationToken cancellationToken = default)
    {
        if (!_isAvailable)
        {
            throw new InvalidOperationException("Piper TTS is not available. Please configure Piper executable and model paths.");
        }

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("Text cannot be empty", nameof(text));
        }

        try
        {
            _logger.LogInformation("🎤 Generating speech for text: {Text}", 
                text.Length > 50 ? text.Substring(0, 50) + "..." : text);

            // Create a temporary file for output (MP3 for Edge TTS)
            var tempOutputFile = Path.Combine(Path.GetTempPath(), $"tts_{Guid.NewGuid()}.mp3");

            try
            {
                // Use default voice if not specified
                var selectedVoice = voice ?? "en-US-AriaNeural";
                
                // Create process to run Python helper script
                var processStartInfo = new ProcessStartInfo
                {
                    FileName = _piperPath,
                    Arguments = $"\"{_modelPath}\" \"{text}\" \"{tempOutputFile}\" \"{selectedVoice}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    StandardOutputEncoding = Encoding.UTF8,
                    StandardErrorEncoding = Encoding.UTF8
                };

                using var process = new Process { StartInfo = processStartInfo };
                
                var errorOutput = new StringBuilder();
                var stdOutput = new StringBuilder();
                
                process.OutputDataReceived += (sender, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        stdOutput.AppendLine(e.Data);
                    }
                };
                
                process.ErrorDataReceived += (sender, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        errorOutput.AppendLine(e.Data);
                    }
                };

                process.Start();
                process.BeginOutputReadLine();
                process.BeginErrorReadLine();

                // Wait for completion (timeout after 30 seconds)
                var completed = await Task.Run(() => process.WaitForExit(30000), cancellationToken);

                if (!completed)
                {
                    process.Kill();
                    throw new TimeoutException("Piper TTS generation timed out after 30 seconds");
                }

                if (process.ExitCode != 0)
                {
                    var error = errorOutput.ToString();
                    var output = stdOutput.ToString();
                    _logger.LogError("❌ Piper Python script failed with exit code {ExitCode}. Error: {Error}, Output: {Output}", 
                        process.ExitCode, error, output);
                    throw new InvalidOperationException($"Piper TTS failed: {error}");
                }

                // Read the generated audio file
                if (!File.Exists(tempOutputFile))
                {
                    throw new FileNotFoundException($"Piper did not generate output file: {tempOutputFile}");
                }

                var audioData = await File.ReadAllBytesAsync(tempOutputFile, cancellationToken);
                _logger.LogInformation("✅ Generated {Size} bytes of audio", audioData.Length);

                return audioData;
            }
            finally
            {
                // Clean up temp file
                if (File.Exists(tempOutputFile))
                {
                    try
                    {
                        File.Delete(tempOutputFile);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete temp file: {TempFile}", tempOutputFile);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to generate speech with Piper TTS");
            throw;
        }
    }
}
