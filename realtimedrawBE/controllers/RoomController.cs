using Microsoft.AspNetCore.Mvc;
[ApiController]
[Route("api/rooms")]
public class RoomController : ControllerBase
{
    [HttpPost("create")]
    public IActionResult CreateRoom([FromBody] string roomId)
    {
        bool success = DrawingHub.Rooms.TryAdd(roomId, new RoomState());
        if (success)
        {
            return Ok(new { message = "Room created." });
        }
        else
        {
            return Conflict(new { message = "That room name is already taken!" });
        }
    }
    [HttpGet]
    public IActionResult GetRooms()
    {
        var result = new
        {
            rooms = DrawingHub.Rooms.Keys.ToList(),
            connections = DrawingHub.Connection.Values.ToList()
        };
        return Ok(result);
    }
}