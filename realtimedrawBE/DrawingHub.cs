using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

public class DrawingHub : Hub
{
    public static ConcurrentDictionary<string, bool> ConnectedUsers = new();
    public static string image64 = string.Empty;
    private const int MaxUsers = 4;
    private const int maxHistory = 30;
    private static readonly List<string> history = new List<string> { string.Empty };
    private static readonly object _historyLock = new object();


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
        await Clients.Caller.SendAsync("ReceiveCanvas", image64);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? ex)
    {
        ConnectedUsers.TryRemove(Context.ConnectionId, out _);
        await Clients.All.SendAsync("UserLeft", ConnectedUsers.Count);
        await base.OnDisconnectedAsync(ex);
    }

    public async Task RequestDraw()
    {

    }
    public async Task SendDraw(float x0, float y0, float x1, float y1, string color, float width, bool isEraser)
    {

        await Clients.Others.SendAsync("ReceiveDraw", x0, y0, x1, y1, color, width, isEraser);

    }

    public async Task ClearCanvas()
    {
        lock (_historyLock)
        {
            history.Clear();
            history.Add(string.Empty);
            image64 = string.Empty;
        }
        await Clients.All.SendAsync("ClearCanvas");
    }
    public async Task SaveCanvas(string ImageData)
    {
        lock (_historyLock)
        {
            if (history.Count > 0 && history[history.Count - 1] == ImageData)
            {
                image64 = ImageData;
                return;
            }

            history.Add(ImageData);
            if (history.Count > maxHistory + 1)
            {
                history.RemoveAt(0);
            }
            image64 = ImageData;
        }
    }

    public async Task SendMessage(string username, string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", username, message);
    }
    public async Task RequestUndo()
    {
        string snapshotToSend = string.Empty;
        lock (_historyLock)
        {
            if (history.Count > 1)
            {
                history.RemoveAt(history.Count - 1);
                snapshotToSend = history[history.Count - 1];
                image64 = snapshotToSend;
            }
            else if (history.Count == 1)
            {
                image64 = history[0];
                snapshotToSend = image64;
            }
            else { image64 = snapshotToSend; }
        }
        await Clients.All.SendAsync("ReceiveCanvas", snapshotToSend);

    }
}
