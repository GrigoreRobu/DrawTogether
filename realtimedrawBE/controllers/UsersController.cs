using Microsoft.AspNetCore.Mvc;
[ApiController]
[Route("api/userCount")]
public class UserCountController : ControllerBase
{
    [HttpGet]
    public IActionResult GetUserCount()
    {
        return Ok(DrawingHub.ConnectedUsers.Count);
    }
}