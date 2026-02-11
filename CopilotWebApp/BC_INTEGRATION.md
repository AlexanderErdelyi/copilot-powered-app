# Business Central Integration Guide

## Overview

The Copilot Chat application now supports integration with Business Central (BC) through the browser's `postMessage` API. This allows BC to receive real-time updates about user messages and assistant responses.

## How It Works

When embedded in an iframe within Business Central:
1. User sends a message in the chat
2. Chat sends the message to BC via `postMessage`
3. Chat processes the message and gets AI response
4. Chat sends the response back to BC via `postMessage`

## Message Format

All messages sent to BC follow this structure:

```javascript
{
    type: 'userMessage' | 'assistantResponse',
    content: string,              // The actual message content
    originalMessage: string,      // For assistantResponse, the user's original question
    timestamp: string,            // ISO 8601 format
    sessionId: string             // Unique session identifier
}
```

### Message Types

#### 1. User Message
Sent when the user sends a message:
```javascript
{
    type: 'userMessage',
    content: 'What is the weather in Paris?',
    originalMessage: '',
    timestamp: '2026-02-11T14:30:00.000Z',
    sessionId: 'session_1707667800000'
}
```

#### 2. Assistant Response
Sent when the AI responds:
```javascript
{
    type: 'assistantResponse',
    content: 'The weather in Paris is sunny with 20°C...',
    originalMessage: 'What is the weather in Paris?',
    timestamp: '2026-02-11T14:30:05.000Z',
    sessionId: 'session_1707667800000'
}
```

## Testing the Integration

### Local Test Page
A test page is included at `/bc-test.html` that simulates Business Central:

1. **Start the server:**
   ```powershell
   cd C:\VSCodeProjects\GitHub\copilot-powered-app\CopilotWebApp
   dotnet bin\Debug\net8.0\CopilotWebApp.dll
   ```

2. **Open the test page:**
   ```
   http://localhost:5001/bc-test.html
   ```

3. **Send messages in the chat** - You'll see them appear in the right panel in real-time

### What You'll See
- Left side: The embedded chat application
- Right side: Messages received by the "parent" window (simulating BC)
- Each message shows type, content, timestamp, and session ID

## Business Central Implementation

### Embedding the Chat in BC

```al
// In your Business Central page
PageExtension 50100 "Copilot Chat Integration" extends "Customer Card"
{
    layout
    {
        addlast(content)
        {
            usercontrol(CopilotChat; "Copilot Chat Control")
            {
                ApplicationArea = All;
                
                trigger OnUserMessage(messageData: Text)
                begin
                    HandleUserMessage(messageData);
                end;
                
                trigger OnAssistantResponse(responseData: Text)
                begin
                    HandleAssistantResponse(responseData);
                end;
            }
        }
    }
}
```

### Receiving Messages in BC

Add this JavaScript in your control add-in:

```javascript
// Listen for messages from the chat iframe
window.addEventListener('message', function(event) {
    // Security: Validate origin in production
    if (event.origin !== 'http://localhost:5001') return;
    
    const data = event.data;
    
    if (data.type === 'userMessage') {
        // User sent a message
        Microsoft.Dynamics.NAV.InvokeExtensibilityMethod(
            'OnUserMessage',
            [JSON.stringify(data)]
        );
    } else if (data.type === 'assistantResponse') {
        // AI responded
        Microsoft.Dynamics.NAV.InvokeExtensibilityMethod(
            'OnAssistantResponse',
            [JSON.stringify(data)]
        );
    }
});
```

### Processing Messages in AL

```al
local procedure HandleUserMessage(MessageJson: Text)
var
    JObject: JsonObject;
    Content: Text;
    Timestamp: Text;
begin
    JObject.ReadFrom(MessageJson);
    
    // Extract message content
    Content := GetJsonValue(JObject, 'content');
    Timestamp := GetJsonValue(JObject, 'timestamp');
    
    // Log to Activity Log or custom table
    LogCopilotActivity('User Message', Content, Timestamp);
end;

local procedure HandleAssistantResponse(ResponseJson: Text)
var
    JObject: JsonObject;
    Content: Text;
    OriginalMessage: Text;
begin
    JObject.ReadFrom(ResponseJson);
    
    Content := GetJsonValue(JObject, 'content');
    OriginalMessage := GetJsonValue(JObject, 'originalMessage');
    
    // Process the response
    LogCopilotActivity('AI Response', Content, OriginalMessage);
    
    // Optionally update BC records based on response
    ProcessAIResponse(Content, OriginalMessage);
end;
```

## Session Management

Each browser session gets a unique `sessionId` stored in `sessionStorage`. This allows BC to:
- Track conversations across multiple messages
- Correlate user messages with AI responses
- Maintain conversation history
- Analytics and logging

The session ID format: `session_[timestamp]`

Example: `session_1707667800000`

## Security Considerations

### For Production

1. **Validate Origin:**
   ```javascript
   window.addEventListener('message', function(event) {
       if (event.origin !== 'https://your-production-domain.com') {
           return; // Reject messages from unknown origins
       }
       // Process message
   });
   ```

2. **Use HTTPS:**
   - Deploy the chat app on HTTPS
   - Update BC to embed via HTTPS URL

3. **Authentication:**
   - Consider adding token-based authentication
   - Pass BC user context to the chat app

## Console Logging

The integration includes helpful console logs:

**In the Chat App:**
- `📤 Sending to BC: [type] [data]` - When sending to parent window
- `ℹ️ Not in iframe, BC integration disabled` - When running standalone

**In the Test Page (BC simulator):**
- `📨 Received from Chat: [data]` - When receiving messages

## Troubleshooting

### Messages Not Appearing in BC

1. **Check Console Logs:**
   - Open DevTools (F12)
   - Look for "Sending to BC" messages
   - Check for errors

2. **Verify iframe Setup:**
   ```javascript
   // The chat detects if it's in an iframe
   if (window.parent && window.parent !== window) {
       // Will send messages
   }
   ```

3. **Check Event Listener:**
   - Ensure BC has `window.addEventListener('message', ...)` set up
   - Verify the origin check isn't blocking messages

### Session ID Not Persisting

- Session ID uses `sessionStorage` (tab-specific)
- Clear browser cache if needed
- Check browser console for errors

## Example Use Cases

### 1. Activity Logging
Log all Copilot interactions to BC Activity Log:
```al
LogActivity(
    ActivityCode: "COPILOT_QUERY",
    Description: Content,
    RelatedRecordID: CustomerNo
);
```

### 2. Customer Support Tracking
Track support queries and AI responses:
```al
CreateSupportTicket(
    Question: OriginalMessage,
    AIResponse: Content,
    SessionID: SessionId
);
```

### 3. Analytics Dashboard
Build dashboards showing:
- Most common queries
- Response times
- User satisfaction
- Feature usage

### 4. Workflow Automation
Trigger BC workflows based on AI responses:
```al
if Content.Contains('create sales order') then
    CreateSalesOrderWorkflow(Content);
```

## Next Steps

1. Test with the provided `/bc-test.html` page
2. Implement the control add-in in Business Central
3. Add logging/analytics based on your needs
4. Deploy to production with proper security

## Support

For issues or questions:
- Check console logs in both chat and BC
- Review the message format structure
- Ensure proper iframe embedding
- Validate `postMessage` origin in production
