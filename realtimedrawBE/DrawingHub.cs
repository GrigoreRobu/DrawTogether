using System.Collections.Concurrent;
using System.Collections.ObjectModel;
using Microsoft.AspNetCore.SignalR;

public class RoomState
{
    public string image64 { get; set; } = string.Empty;
    public List<string> History { get; set; } = new List<string>();
    public object HistoryLock { get; set; } = new object();
}
public class DrawingHub : Hub
{
    public static ConcurrentDictionary<string, bool> ConnectedUsers = new();
    public static ConcurrentDictionary<string, RoomState> Rooms = new();

    public static ConcurrentDictionary<string, string> Connection = new();
    private const int MaxUsers = 4;
    private const int maxHistory = 30;
    private static readonly List<string> history = new List<string> { string.Empty };
    private static readonly object _historyLock = new object();
    public string[] roomz = { "room1", "room2", "room3" };



    public override async Task OnConnectedAsync()
    {
        ConnectedUsers[Context.ConnectionId] = true;
        await Clients.Caller.SendAsync("Joined", ConnectedUsers.Count);
        await Clients.Others.SendAsync("UserJoined", ConnectedUsers.Count);

        await base.OnConnectedAsync();
    }
    public async Task JoinRoom(string roomCode, string username)
    {
        bool isPrefab = roomz.Contains(roomCode);
        bool isExisting = Rooms.ContainsKey(roomCode);

        if (!isPrefab && !isExisting)
        {
            await Clients.Caller.SendAsync("JoinRoomError", "Room does not exist.");
            return;
        }
        if (!Rooms.ContainsKey(roomCode))
        {
            Rooms.TryAdd(roomCode, new RoomState());
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        Connection[Context.ConnectionId] = roomCode;

        string currentCanvas = Rooms[roomCode].image64;
        await Clients.Caller.SendAsync("RoomJoined", currentCanvas);
        await Clients.Others.SendAsync("UserJoined", username);


    }
    public override async Task OnDisconnectedAsync(Exception? ex)
    {
        if (Connection.TryRemove(Context.ConnectionId, out string roomCode))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
            int usersLeft = Connection.Values.Count(c => c == roomCode);
            await Clients.Group(roomCode).SendAsync("UserLeft", usersLeft);
            if (usersLeft <= 0)
            {
                Rooms.TryRemove(roomCode, out _);
            }
        }
        ConnectedUsers.TryRemove(Context.ConnectionId, out _);
        await base.OnDisconnectedAsync(ex);
    }

    public async Task RequestDraw()
    {

    }
    public async Task SendDraw(float x0, float y0, float x1, float y1, string color, float width, bool isEraser)
    {
        if (Connection.TryGetValue(Context.ConnectionId, out string roomCode))
        {
            await Clients.OthersInGroup(roomCode).SendAsync("ReceiveDraw", x0, y0, x1, y1, color, width, isEraser);
        }

    }

    public async Task ClearCanvas()
    {
        if (Connection.TryGetValue(Context.ConnectionId, out string roomCode))
        {
            lock (Rooms[roomCode].HistoryLock)
            {
                Rooms[roomCode].History.Clear();
                Rooms[roomCode].History.Add(string.Empty);
                Rooms[roomCode].image64 = string.Empty;
            }
            await Clients.Group(roomCode).SendAsync("ClearCanvas");
        }
    }
    public async Task SaveCanvas(string ImageData)
    {
        if (Connection.TryGetValue(Context.ConnectionId, out string roomCode))
        {
            var roomState = Rooms[roomCode];
            lock (roomState.HistoryLock)
            {
                if (roomState.History.Count > 0 && roomState.History[roomState.History.Count - 1] == ImageData)
                {
                    roomState.image64 = ImageData;
                    return;
                }

                roomState.History.Add(ImageData);
                if (roomState.History.Count > maxHistory + 1)
                {
                    roomState.History.RemoveAt(0);
                }
                roomState.image64 = ImageData;
            }
        }
    }

    public async Task SendMessage(string username, string message)
    {
        if (Connection.TryGetValue(Context.ConnectionId, out string roomCode))
        {
            await Clients.Group(roomCode).SendAsync("ReceiveMessage", username, message);
        }
    }
    public async Task RequestUndo()
    {
        if (Connection.TryGetValue(Context.ConnectionId, out string roomCode))
        {
            var roomState = Rooms[roomCode];
            string snapshotToSend = string.Empty;
            lock (roomState.HistoryLock)
            {
                if (roomState.History.Count > 1)
                {
                    roomState.History.RemoveAt(roomState.History.Count - 1);
                    snapshotToSend = roomState.History[roomState.History.Count - 1];
                    roomState.image64 = snapshotToSend;
                }
                else if (roomState.History.Count == 1)
                {
                    roomState.image64 = roomState.History[0];
                    snapshotToSend = roomState.image64;
                }
                else { roomState.image64 = snapshotToSend; }
            }
            await Clients.Group(roomCode).SendAsync("ReceiveCanvas", snapshotToSend);
        }

    }
}
