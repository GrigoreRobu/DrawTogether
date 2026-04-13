var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 10 * 1024 * 1024; // 10MB
});
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost",
                "https://drawtogether-b1988.web.app"
            );
    });
});


var app = builder.Build();
app.UseRouting();
app.UseCors();
app.MapControllers();

app.MapHub<DrawingHub>("/drawingHub");

foreach (var room in DrawingHub.DefaultRooms)
{
    DrawingHub.Rooms.TryAdd(room, new RoomState());
}


app.Run();
