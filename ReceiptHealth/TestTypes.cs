using GitHub.Copilot.SDK;

namespace TestNS;
public class TestTypes 
{
    public void Test()
    {
        var fileItem = new UserMessageDataAttachmentsItemFile 
        { 
            Path = "test.jpg", 
            DisplayName = "test.jpg" 
        };
        
        // Try implicit conversion
        UserMessageDataAttachmentsItem item = fileItem;
        
        var opts = new MessageOptions 
        { 
            Prompt = "test",
            Attachments = new List<UserMessageDataAttachmentsItem> { item }
        };
    }
}
