using Microsoft.AspNetCore.Mvc;
[ApiController]
[Route("userCount")]
public class UserCountController : ControllerBase
{
    [HttpGet]
    public IActionResult GetUserCount()
    {
        return Ok(DrawingHub.ConnectedUsers.Count);
    }
}