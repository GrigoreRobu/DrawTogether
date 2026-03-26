using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

public class DrawingHub : Hub
{
    public static ConcurrentDictionary<string, bool> ConnectedUsers = new();
    public static string image64 = string.Empty;
    private const int MaxUsers = 4;

    public override async Task OnConnectedAsync()
    {
        if (ConnectedUsers.Count >= MaxUsers)
        {
            await Clients.Caller.SendAsync("RoomFull");
            Context.Abort();
            return;
        }

        ConnectedUsers[Context.ConnectionId] = true;
        await Clients.Caller.SendAsync("Joined", ConnectedUsers.Count);
        await Clients.Others.SendAsync("UserJoined", ConnectedUsers.Count);
        await Clients.Caller.SendAsync("RecieveCanvas", image64);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception ex)
    {
        ConnectedUsers.TryRemove(Context.ConnectionId, out _);
        await Clients.All.SendAsync("UserLeft", ConnectedUsers.Count);
        await base.OnDisconnectedAsync(ex);
    }

    public async Task RequestDraw()
    {
        
    }
    public async Task SendDraw(float x0, float y0, float x1, float y1, string color, float width)
    {
        await Clients.Others.SendAsync("ReceiveDraw", x0, y0, x1, y1, color, width);
    }

    public async Task ClearCanvas()
    {
        await Clients.All.SendAsync("ClearCanvas");
    }
    public async Task SaveCanvas(string ImageData)
    {
        image64 = ImageData;
        Console.WriteLine(image64);
    }
}
