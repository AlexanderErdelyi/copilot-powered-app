# GitHub Copilot SDK Integration

## Overview

ReceiptHealth now uses the GitHub Copilot SDK to provide AI-powered OCR and receipt parsing capabilities. This document explains how the integration works and how to use it.

## Architecture

### AI-Powered Services

1. **AICopilotTextExtractionService** (`Services/AICopilotTextExtractionService.cs`)
   - Replaces mock OCR implementation with real AI-powered text extraction
   - Uses GPT-4o (gpt-4o) vision model for image analysis
   - Converts images to base64 and sends to AI for OCR
   - Extracts text from PDF files using AI
   - Falls back with error if extraction fails

2. **AICopilotReceiptParserService** (`Services/AICopilotReceiptParserService.cs`)
   - Replaces regex-based parsing with intelligent AI parsing
   - Uses GPT-4.1 model for understanding receipt structure
   - Returns structured JSON data with vendor, date, items, totals
   - Falls back to basic parsing if AI fails

### Configuration

The application can be configured to use AI-powered or basic services via `appsettings.json`:

```json
{
  "ReceiptHealth": {
    "UseAI": true
  }
}
```

- `true` - Uses AI-powered services (requires GitHub Copilot SDK)
- `false` - Uses basic regex-based services (no AI required)

## How It Works

### Image OCR Flow

1. User uploads an image (JPG/PNG)
2. Image file is saved to storage
3. `AICopilotTextExtractionService.ExtractTextFromImageAsync()` is called
4. Image is read and converted to base64
5. A Copilot session is created with GPT-4o model
6. Base64 image is sent with OCR prompt
7. AI extracts and returns text
8. Text is passed to receipt parser

### Receipt Parsing Flow

1. Extracted text is received
2. `AICopilotReceiptParserService.ParseReceiptAsync()` is called
3. A Copilot session is created with GPT-4.1 model
4. Text is sent with structured JSON parsing prompt
5. AI returns JSON with vendor, date, line items, totals
6. JSON is deserialized into Receipt and LineItem objects
7. If JSON parsing fails, falls back to basic regex parsing

## Key Benefits

### Compared to Traditional OCR (Tesseract, etc.)

- ✅ **Higher accuracy** - GPT-4 Vision understands context and layout
- ✅ **No dependencies** - No need to install Tesseract or other OCR libraries
- ✅ **Works with various formats** - Handles poor quality, rotated, or partial images
- ✅ **Intelligent parsing** - Understands receipt structure automatically
- ✅ **No training needed** - Works out of the box with any receipt format

### Compared to Regex-Based Parsing

- ✅ **More flexible** - Handles varying receipt formats and layouts
- ✅ **Better accuracy** - AI understands context (e.g., "Subtotal" vs line item)
- ✅ **Structured output** - Returns clean JSON instead of fragile regex matches
- ✅ **Self-correcting** - Can handle typos and OCR errors in the text

## Requirements

### GitHub Copilot Subscription

The GitHub Copilot SDK requires an active GitHub Copilot subscription. During runtime:

1. The SDK automatically downloads the Copilot CLI binary (if not present)
2. The SDK authenticates using your GitHub Copilot credentials
3. If authentication fails, the services will throw an exception

### Authentication

The Copilot SDK uses your GitHub Copilot subscription for authentication. Make sure:

- You have an active GitHub Copilot subscription (Individual, Business, or Enterprise)
- You're authenticated to GitHub Copilot in your development environment
- The SDK can access GitHub Copilot API endpoints

## Error Handling

### Authentication Errors

If the SDK cannot authenticate:
```
Failed to create Copilot session: Authentication required
```

**Solution**: Ensure you have an active GitHub Copilot subscription and are authenticated.

### API Errors

If the AI API fails:
```
Failed to extract text from image: API error
```

**Solution**: The service will throw an exception. Check logs for details.

### Fallback Behavior

- `AICopilotReceiptParserService` falls back to basic regex parsing if AI fails
- `AICopilotTextExtractionService` throws exception if extraction fails (no fallback)

## Testing

### With Text Files

Text files work without AI (directly read from file):
```bash
curl -X POST http://localhost:5002/api/upload \
  -F "file=@sample-receipt.txt"
```

### With Images (Requires AI)

Image files require AI-powered OCR:
```bash
curl -X POST http://localhost:5002/api/upload \
  -F "file=@receipt-image.jpg"
```

### With PDF Files (Requires AI)

PDF files require AI-powered extraction:
```bash
curl -X POST http://localhost:5002/api/upload \
  -F "file=@receipt.pdf"
```

## Development Notes

### Session Management

Each extraction/parsing operation creates a new Copilot session:
```csharp
await using var session = await _copilotClient.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-4o", // or "gpt-4.1"
    Streaming = false
});
```

Sessions are disposed after use to free resources.

### Prompt Engineering

The prompts in the services are carefully crafted to:
- Instruct the AI to return only extracted text (no commentary)
- Request structured JSON output for parsing
- Maintain consistent formatting
- Handle edge cases

Modify prompts in the service files to adjust behavior.

### Cost Considerations

Each API call to GPT-4 Vision or GPT-4.1 incurs costs:
- Image OCR: ~1-2 calls per image
- Receipt parsing: ~1 call per receipt
- Total: ~2-3 API calls per image/PDF upload

GitHub Copilot SDK usage is covered by your Copilot subscription.

## Troubleshooting

### Build Issues

If the SDK fails to download:
```
Error: Failed to download Copilot CLI
```

**Solution**: Ensure you have internet connectivity and can access npmjs.org and GitHub APIs.

### Runtime Issues

If the application fails at runtime:

1. Check logs for specific error messages
2. Verify `UseAI` configuration in appsettings.json
3. Ensure GitHub Copilot authentication is working
4. Try setting `UseAI: false` to use basic services

### Performance Issues

If processing is slow:
- Each AI call takes 2-10 seconds depending on image size
- Consider implementing caching for duplicate images (already handled via SHA256)
- Consider batch processing for multiple files

## Future Enhancements

Potential improvements to the AI integration:

- [ ] Caching AI responses to reduce API calls
- [ ] Batch processing multiple receipts in parallel
- [ ] Fine-tuning prompts for specific vendors
- [ ] Adding retry logic for transient API failures
- [ ] Implementing rate limiting for API calls
- [ ] Adding AI-powered categorization (replace keyword-based)
- [ ] Multi-language receipt support
- [ ] Confidence scores for extracted data

## References

- [GitHub Copilot SDK Documentation](https://github.com/github/copilot-sdk)
- [GitHub Copilot SDK Getting Started](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md)
- [Microsoft.Extensions.AI Documentation](https://learn.microsoft.com/en-us/dotnet/ai/microsoft-extensions-ai)
- [GPT-4 Vision Documentation](https://platform.openai.com/docs/guides/vision)
