using System.Text;
using System.Text.Json;
using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

/// <summary>
/// Enhanced Voice Assistant using GitHub Copilot SDK for intelligent command processing
/// </summary>
public class VoiceAssistantService
{
    private readonly CopilotClient _copilotClient;
    private readonly ILogger<VoiceAssistantService> _logger;
    private readonly IShoppingListService _shoppingListService;
    private readonly ReceiptHealthContext _context;
    private readonly IHealthScoreService _healthScoreService;
    
    // Conversation history per session (in production, use distributed cache)
    private static readonly Dictionary<string, List<ConversationMessage>> _conversations = new();

    public VoiceAssistantService(
        ILogger<VoiceAssistantService> logger,
        IShoppingListService shoppingListService,
        ReceiptHealthContext context,
        IHealthScoreService healthScoreService)
    {
        _copilotClient = new CopilotClient();
        _logger = logger;
        _shoppingListService = shoppingListService;
        _context = context;
        _healthScoreService = healthScoreService;
    }

    public async Task<VoiceCommandResponse> ProcessVoiceCommandAsync(
        string transcript,
        string? sessionId = null,
        List<ConversationMessage>? history = null)
    {
        _logger.LogInformation("🎤 Processing voice command: {Transcript}", transcript);

        try
        {
            // Create or get conversation history
            sessionId ??= Guid.NewGuid().ToString();
            if (!_conversations.ContainsKey(sessionId))
            {
                _conversations[sessionId] = new List<ConversationMessage>();
            }

            var conversationHistory = _conversations[sessionId];

            // Restore conversation history from client if provided
            if (history != null && history.Count > 0)
            {
                conversationHistory.Clear();
                conversationHistory.AddRange(history);
            }

            // Add user's command
            conversationHistory.Add(new ConversationMessage
            {
                Role = "user",
                Content = transcript
            });

            // Build the prompt with system instructions and conversation history
            var prompt = BuildPromptWithHistory(conversationHistory);

            // Get AI response using Copilot SDK
            var session = await _copilotClient.CreateSessionAsync();
            var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });
            
            var responseText = response?.Data?.Content?.Trim() ?? "Sorry, I couldn't process that request.";

            _logger.LogInformation("🤖 AI Response: {Response}", responseText);

            // Parse the response to extract intent and parameters
            var commandResponse = await ParseAndExecuteCommand(responseText, transcript);

            // Add assistant's response to history
            conversationHistory.Add(new ConversationMessage
            {
                Role = "assistant",
                Content = commandResponse.Response
            });

            // Trim history to last 10 messages
            if (conversationHistory.Count > 20)
            {
                conversationHistory.RemoveRange(0, conversationHistory.Count - 20);
            }

            commandResponse.SessionId = sessionId;
            return commandResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing voice command");
            return new VoiceCommandResponse
            {
                Success = false,
                Response = $"Oops, something weird happened. Wanna try that again?",
                Intent = "error"
            };
        }
    }

    private string BuildPromptWithHistory(List<ConversationMessage> history)
    {
        var sb = new StringBuilder();
        sb.AppendLine(GetSystemPrompt());
        sb.AppendLine();
        sb.AppendLine("Conversation History:");
        
        foreach (var msg in history)
        {
            sb.AppendLine($"{msg.Role.ToUpper()}: {msg.Content}");
        }

        return sb.ToString();
    }

    private string GetSystemPrompt()
    {
        return @"Hey! You're talking to someone using ReceiptHealth - they're trying to eat healthier and organize their shopping. Just chat with them naturally!

You can help them:

Shopping Lists:
- Make shopping lists (CREATE_SHOPPING_LIST)
- Add stuff to their lists (ADD_ITEM_TO_LIST)
- Delete a specific list (DELETE_SHOPPING_LIST)
- Delete ALL lists (DELETE_ALL_SHOPPING_LISTS)
- Show all their lists (LIST_SHOPPING_LISTS)
- View a specific list in detail (VIEW_SHOPPING_LIST)
- Build a healthy shopping list from what they usually buy (GENERATE_HEALTHY_LIST)

Receipts:
- Look up old receipts (QUERY_RECEIPTS)
- Find items they bought before (QUERY_ITEMS)
- Open a specific receipt (OPEN_RECEIPT)
- Check how healthy their food choices are (GET_HEALTH_SCORE)

Navigation:
- Go to different pages (NAVIGATE) - dashboard, receipts, shopping-lists, voice-assistant

File Actions:
- Upload a file/receipt (UPLOAD_FILE)
- Take a photo of receipt (TAKE_PHOTO)

General:
- Just chat about whatever (GENERAL_CHAT)

How to respond - Start with JSON on first line, then talk normally:
```json
{""intent"":""WHATEVER_FITS"",""parameters"":{""listName"":""..."",""itemName"":""..."",...}}
```
Then just... talk like you would to a friend! Short, casual, real.

Examples of how real people talk:

Them: make a list for groceries
You: ```json{""intent"":""CREATE_SHOPPING_LIST"",""parameters"":{""listName"":""groceries""}}```
Got it! Your groceries list is ready.

Them: add bananas
You: ```json{""intent"":""ADD_ITEM_TO_LIST"",""parameters"":{""itemName"":""bananas"",""quantity"":1}}```
Bananas - done! Love that you're going healthy.

Them: show me my groceries list
You: ```json{""intent"":""VIEW_SHOPPING_LIST"",""parameters"":{""listName"":""groceries""}}```
Here's what's on your groceries list...

Them: delete all my lists
You: ```json{""intent"":""DELETE_ALL_SHOPPING_LISTS"",""parameters"":{}}```
Okay, clearing everything out...

Them: what did i buy at lidl
You: ```json{""intent"":""QUERY_RECEIPTS"",""parameters"":{""storeName"":""Lidl"",""daysBack"":7}}```
Lemme check your Lidl trips...

Them: open the walmart receipt
You: ```json{""intent"":""OPEN_RECEIPT"",""parameters"":{""storeName"":""Walmart""}}```
Opening that Walmart receipt for you...

Them: go to dashboard
You: ```json{""intent"":""NAVIGATE"",""parameters"":{""page"":""dashboard""}}```
Taking you to the dashboard!

Them: upload a receipt
You: ```json{""intent"":""UPLOAD_FILE"",""parameters"":{}}```
Sure! Opening the file picker...

Them: take a photo
You: ```json{""intent"":""TAKE_PHOTO"",""parameters"":{}}```
Let's snap that receipt!

Them: hows my health score
You: ```json{""intent"":""GET_HEALTH_SCORE"",""parameters"":{}}```
Ooh good question, let's see...

Just be human:
- Use contractions (I'm, you're, what's, lemme)
- Skip formality (nah, yeah, ooh, hmm, btw)
- Sound like texting (short, punchy, casual)
- React naturally (Nice! Awesome! Oh! Got it!)
- Remember what they said before
- Never say IDs, database, technical stuff
- If something breaks just say oops something went weird, wanna try again?";
    }

    private async Task<VoiceCommandResponse> ParseAndExecuteCommand(string aiResponse, string originalTranscript)
    {
        var response = new VoiceCommandResponse { Success = false };

        try
        {
            // Extract JSON from the AI response
            var jsonMatch = System.Text.RegularExpressions.Regex.Match(
                aiResponse,
                @"```json\s*(\{.*?\})\s*```",
                System.Text.RegularExpressions.RegexOptions.Singleline
            );

            if (!jsonMatch.Success)
            {
                _logger.LogWarning("⚠️ No JSON command found in AI response, treating as general chat");
                response.Intent = "GENERAL_CHAT";
                response.Response = aiResponse;
                response.Success = true;
                return response;
            }

            var jsonStr = jsonMatch.Groups[1].Value;
            var naturalResponse = aiResponse.Replace(jsonMatch.Value, "").Trim();

            var commandData = JsonSerializer.Deserialize<JsonElement>(jsonStr);
            var intent = commandData.GetProperty("intent").GetString() ?? "GENERAL_CHAT";
            var parameters = commandData.TryGetProperty("parameters", out var paramsElement) 
                ? paramsElement 
                : new JsonElement();

            _logger.LogInformation("🎯 Intent: {Intent}", intent);

            response.Intent = intent;
            response.Response = naturalResponse;

            // Execute the command based on intent
            switch (intent)
            {
                case "CREATE_SHOPPING_LIST":
                    await HandleCreateShoppingList(parameters, response);
                    break;

                case "ADD_ITEM_TO_LIST":
                    await HandleAddItemToList(parameters, response);
                    break;

                case "DELETE_SHOPPING_LIST":
                    await HandleDeleteShoppingList(parameters, response);
                    break;

                case "GENERATE_HEALTHY_LIST":
                    await HandleGenerateHealthyList(parameters, response);
                    break;

                case "QUERY_RECEIPTS":
                    await HandleQueryReceipts(parameters, response);
                    break;

                case "QUERY_ITEMS":
                    await HandleQueryItems(parameters, response);
                    break;

                case "GET_HEALTH_SCORE":
                    await HandleGetHealthScore(response);
                    break;

                case "LIST_SHOPPING_LISTS":
                    await HandleListShoppingLists(response);
                    break;

                case "VIEW_SHOPPING_LIST":
                    await HandleViewShoppingList(parameters, response);
                    break;

                case "DELETE_ALL_SHOPPING_LISTS":
                    await HandleDeleteAllShoppingLists(response);
                    break;

                case "NAVIGATE":
                    HandleNavigate(parameters, response);
                    break;

                case "UPLOAD_FILE":
                    HandleUploadFile(response);
                    break;

                case "TAKE_PHOTO":
                    HandleTakePhoto(response);
                    break;

                case "OPEN_RECEIPT":
                    await HandleOpenReceipt(parameters, response);
                    break;

                case "GET_INSIGHTS":
                case "GENERAL_CHAT":
                    // Already handled, just return the AI's natural response
                    response.Success = true;
                    break;

                default:
                    _logger.LogWarning("⚠️ Unknown intent: {Intent}", intent);
                    response.Success = true;
                    break;
            }

            // Generate a natural final response based on actual results
            if (response.Success && response.Data != null && intent != "GENERAL_CHAT" && intent != "GET_INSIGHTS")
            {
                await EnhanceResponseWithResults(originalTranscript, intent, response);
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error parsing or executing command");
            response.Response = $"I got your request but something went wonky. Lemme know if you wanna try again?";
            return response;
        }
    }

    private async Task HandleCreateShoppingList(JsonElement parameters, VoiceCommandResponse response)
    {
        var listName = parameters.TryGetProperty("listName", out var nameElement)
            ? nameElement.GetString()
            : "My Shopping List";

        var list = await _shoppingListService.CreateShoppingListAsync(listName ?? "My Shopping List");
        
        response.Success = true;
        response.Data = new { listId = list.Id, listName = list.Name };
        // Let AI's natural response speak for itself - no technical details
        _logger.LogInformation("✅ Created shopping list: {ListName} (ID: {ListId})", list.Name, list.Id);
    }

    private async Task HandleAddItemToList(JsonElement parameters, VoiceCommandResponse response)
    {
        var itemName = parameters.TryGetProperty("itemName", out var nameElement)
            ? nameElement.GetString()
            : null;

        if (string.IsNullOrEmpty(itemName))
        {
            response.Response = "Hmm, didn't catch what you wanna add. What was it?";
            return;
        }

        // Get list ID (either specified or most recent)
        int? listId = null;
        if (parameters.TryGetProperty("listId", out var listIdElement))
        {
            if (int.TryParse(listIdElement.GetString(), out var id))
                listId = id;
        }

        if (!listId.HasValue)
        {
            var lists = await _shoppingListService.GetAllShoppingListsAsync();
            listId = lists.FirstOrDefault()?.Id;
        }

        if (!listId.HasValue)
        {
            response.Response = "You don't have any lists yet - wanna make one real quick?";
            return;
        }

        var quantity = parameters.TryGetProperty("quantity", out var qtyElement)
            ? qtyElement.GetInt32()
            : 1;

        var item = await _shoppingListService.AddItemAsync(listId.Value, itemName, quantity);
        
        response.Success = true;
        response.Data = new { listId, itemId = item.Id, itemName = item.ItemName, quantity = item.Quantity };
        // Let AI's natural response speak for itself
        _logger.LogInformation("✅ Added item: {ItemName} to list {ListId}", itemName, listId);
    }

    private async Task HandleDeleteShoppingList(JsonElement parameters, VoiceCommandResponse response)
    {
        int? listId = null;
        if (parameters.TryGetProperty("listId", out var listIdElement))
        {
            if (int.TryParse(listIdElement.GetString(), out var id))
                listId = id;
        }

        if (!listId.HasValue)
        {
            response.Response = "Which list? Just tell me the name!";
            return;
        }

        await _shoppingListService.DeleteShoppingListAsync(listId.Value);
        
        response.Success = true;
        // Let AI's natural response speak for itself
        _logger.LogInformation("✅ Deleted shopping list: {ListId}", listId);
    }

    private async Task HandleGenerateHealthyList(JsonElement parameters, VoiceCommandResponse response)
    {
        var daysBack = parameters.TryGetProperty("daysBack", out var daysElement)
            ? daysElement.GetInt32()
            : 30;

        var list = await _shoppingListService.GenerateFromHealthyItemsAsync(daysBack);
        
        response.Success = true;
        response.Data = new { listId = list.Id, listName = list.Name, itemCount = list.Items.Count, daysBack };
        // Let AI's natural response speak for itself - it knows the data from response.Data
        _logger.LogInformation("✅ Generated healthy list: {ListName} with {Count} items", list.Name, list.Items.Count);
    }

    private async Task HandleQueryReceipts(JsonElement parameters, VoiceCommandResponse response)
    {
        // Get all receipts and filter based on parameters
        var receipts = await _context.Receipts
            .Include(r => r.LineItems)
            .OrderByDescending(r => r.Date)
            .Take(100)
            .ToListAsync();

        var storeName = parameters.TryGetProperty("storeName", out var storeElement)
            ? storeElement.GetString()
            : null;

        var daysBack = parameters.TryGetProperty("daysBack", out var daysElement)
            ? daysElement.GetInt32()
            : 30;

        var filtered = receipts.Where(r => r.Date >= DateTime.Now.AddDays(-daysBack));

        if (!string.IsNullOrEmpty(storeName))
        {
            filtered = filtered.Where(r => r.Vendor?.Contains(storeName, StringComparison.OrdinalIgnoreCase) == true);
        }

        var receiptList = filtered.ToList();
        var totalAmount = receiptList.Sum(r => r.Total);
        var count = receiptList.Count;

        response.Success = true;
        response.Data = new { count, totalAmount, storeName, daysBack, receipts = receiptList.Take(5).Select(r => new { r.Vendor, r.Date, r.Total }) };
        // Let AI's natural response speak for itself
        _logger.LogInformation("📊 Found {Count} receipts, total: {Total}", count, totalAmount);
    }

    private async Task HandleQueryItems(JsonElement parameters, VoiceCommandResponse response)
    {
        var categoryName = parameters.TryGetProperty("categoryName", out var catElement)
            ? catElement.GetString()
            : null;

        var receipts = await _context.Receipts
            .Include(r => r.LineItems)
            .ToListAsync();
        var allItems = receipts.SelectMany(r => r.LineItems).ToList();

        if (!string.IsNullOrEmpty(categoryName))
        {
            allItems = allItems.Where(i => i.Category?.Equals(categoryName, StringComparison.OrdinalIgnoreCase) == true).ToList();
        }

        var itemGroups = allItems
            .GroupBy(i => i.Description)
            .Select(g => new { ItemName = g.Key, Count = g.Count(), TotalSpent = g.Sum(i => i.Price) })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();

        response.Success = true;
        response.Data = new { items = itemGroups, categoryName };
        // Let AI's natural response speak for itself
    }

    private async Task HandleGetHealthScore(VoiceCommandResponse response)
    {
        // Get all line items to calculate health score
        var lineItems = await _context.LineItems.ToListAsync();
        var score = _healthScoreService.ComputeHealthScore(lineItems);
        
        response.Success = true;
        response.Data = new { healthScore = score };
        // Let AI's natural response speak for itself
        _logger.LogInformation("💚 Health score: {Score}", score);
    }

    private async Task HandleListShoppingLists(VoiceCommandResponse response)
    {
        var lists = await _shoppingListService.GetAllShoppingListsAsync();
        
        response.Success = true;
        response.Data = new { listCount = lists.Count(), lists = lists.Select(l => new { l.Name, ItemCount = l.Items.Count }) };
        // Let AI's natural response speak for itself
    }

    private async Task HandleViewShoppingList(JsonElement parameters, VoiceCommandResponse response)
    {
        try
        {
            var listName = parameters.TryGetProperty("listName", out var nameElement) ? nameElement.GetString() : null;
            var listId = parameters.TryGetProperty("listId", out var idElement) ? idElement.GetInt32() : 0;

            // Find the list by name or ID
            var allLists = await _shoppingListService.GetAllShoppingListsAsync();
            var list = listId > 0 
                ? allLists.FirstOrDefault(l => l.Id == listId)
                : allLists.FirstOrDefault(l => l.Name.Contains(listName ?? "", StringComparison.OrdinalIgnoreCase));

            if (list == null)
            {
                response.Response = listName != null 
                    ? $"Can't find a list called '{listName}'. Wanna make one?"
                    : "Which list? Tell me the name!";
                response.Success = false;
                return;
            }

            response.Success = true;
            response.Data = new 
            { 
                listId = list.Id,
                listName = list.Name,
                itemCount = list.Items.Count,
                items = list.Items.Select(i => new 
                { 
                    i.ItemName, 
                    i.Quantity, 
                    i.IsPurchased,
                    lastKnownPrice = i.LastKnownPrice
                }),
                totalEstimatedCost = list.Items.Sum(i => i.LastKnownPrice ?? 0)
            };
            _logger.LogInformation("📋 Viewing list: {ListName} ({ItemCount} items)", list.Name, list.Items.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error viewing shopping list");
            response.Response = "Oops, couldn't load that list. Try again?";
        }
    }

    private async Task HandleDeleteAllShoppingLists(VoiceCommandResponse response)
    {
        try
        {
            var allLists = await _shoppingListService.GetAllShoppingListsAsync();
            var count = allLists.Count();

            if (count == 0)
            {
                response.Response = "You don't have any lists to delete!";
                response.Success = true;
                return;
            }

            foreach (var list in allLists)
            {
                await _shoppingListService.DeleteShoppingListAsync(list.Id);
            }

            response.Success = true;
            response.Data = new { deletedCount = count };
            _logger.LogInformation("🗑️ Deleted all shopping lists ({Count} lists)", count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error deleting all shopping lists");
            response.Response = "Something went weird trying to delete everything. Try again?";
        }
    }

    private void HandleNavigate(JsonElement parameters, VoiceCommandResponse response)
    {
        var page = parameters.TryGetProperty("page", out var pageElement) ? pageElement.GetString() : "dashboard";
        
        // Map common page references to actual URLs
        var pageMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "dashboard", "/" },
            { "home", "/" },
            { "receipts", "/receipts.html" },
            { "shopping-lists", "/index.html#shopping" },
            { "shopping", "/index.html#shopping" },
            { "lists", "/index.html#shopping" },
            { "voice", "/voice-assistant.html" },
            { "voice-assistant", "/voice-assistant.html" },
            { "assistant", "/voice-assistant.html" }
        };

        var url = pageMap.ContainsKey(page ?? "") ? pageMap[page!] : "/";

        response.Success = true;
        response.Data = new { action = "navigate", url };
        _logger.LogInformation("🧭 Navigate to: {Page} ({Url})", page, url);
    }

    private void HandleUploadFile(VoiceCommandResponse response)
    {
        response.Success = true;
        response.Data = new { action = "upload_file" };
        _logger.LogInformation("📁 Triggering file upload");
    }

    private void HandleTakePhoto(VoiceCommandResponse response)
    {
        response.Success = true;
        response.Data = new { action = "take_photo" };
        _logger.LogInformation("📸 Triggering camera");
    }

    private async Task HandleOpenReceipt(JsonElement parameters, VoiceCommandResponse response)
    {
        try
        {
            var storeName = parameters.TryGetProperty("storeName", out var storeElement) ? storeElement.GetString() : null;
            var receiptId = parameters.TryGetProperty("receiptId", out var idElement) ? idElement.GetInt32() : 0;
            var daysBack = parameters.TryGetProperty("daysBack", out var daysElement) ? daysElement.GetInt32() : 30;

            // Find the receipt
            var query = _context.Receipts
                .Include(r => r.LineItems)
                .Where(r => r.Date >= DateTime.UtcNow.AddDays(-daysBack));

            Receipt? receipt = null;

            if (receiptId > 0)
            {
                receipt = await query.FirstOrDefaultAsync(r => r.Id == receiptId);
            }
            else if (!string.IsNullOrEmpty(storeName))
            {
                // Find most recent receipt from that store
                receipt = await query
                    .Where(r => r.Vendor.Contains(storeName, StringComparison.OrdinalIgnoreCase))
                    .OrderByDescending(r => r.Date)
                    .FirstOrDefaultAsync();
            }
            else
            {
                // Get most recent receipt
                receipt = await query.OrderByDescending(r => r.Date).FirstOrDefaultAsync();
            }

            if (receipt == null)
            {
                response.Response = storeName != null
                    ? $"Can't find a receipt from {storeName}. Got a different store?"
                    : "No receipts found. Upload one first!";
                response.Success = false;
                return;
            }

            response.Success = true;
            response.Data = new 
            { 
                action = "open_receipt",
                receiptId = receipt.Id,
                documentId = receipt.DocumentId,
                vendor = receipt.Vendor,
                date = receipt.Date,
                total = receipt.Total,
                itemCount = receipt.LineItems.Count,
                url = $"/receipts.html?id={receipt.Id}"
            };
            _logger.LogInformation("🧾 Opening receipt: {Vendor} ({Date})", receipt.Vendor, receipt.Date);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error opening receipt");
            response.Response = "Oops, trouble finding that receipt. Try again?";
        }
    }

    private async Task EnhanceResponseWithResults(string originalRequest, string intent, VoiceCommandResponse response)
    {
        try
        {
            var dataJson = JsonSerializer.Serialize(response.Data, new JsonSerializerOptions { WriteIndented = true });
            
            var enhancementPrompt = $@"Your friend just asked: {originalRequest}

You helped them with: {intent}

Here's what actually happened:
{dataJson}

Now just tell them real quick what happened. Like you're texting. Super casual. One or two lines max.

Don't be formal or robotic. Just... talk. Use contractions. Be chill. React naturally.

What you'd say:";

            var session = await _copilotClient.CreateSessionAsync();
            var enhancedResponse = await session.SendAndWaitAsync(new MessageOptions { Prompt = enhancementPrompt });
            
            var naturalResponse = enhancedResponse?.Data?.Content?.Trim();
            if (!string.IsNullOrEmpty(naturalResponse))
            {
                response.Response = naturalResponse;
                _logger.LogInformation("✨ Enhanced response: {Response}", naturalResponse);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Failed to enhance response, using original");
            // Keep original response on error
        }
    }
}

public class VoiceCommandResponse
{
    public bool Success { get; set; }
    public string Intent { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public object? Data { get; set; }
    public string? SessionId { get; set; }
}

public class ConversationMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
