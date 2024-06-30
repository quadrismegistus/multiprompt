import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import router
from app.socket_routes import websocket_endpoint

# Create the FastAPI application
app = FastAPI()

# Mount the static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include the router for API routes
app.include_router(router)

# Add the WebSocket endpoint
app.add_api_websocket_route("/ws/multiprompt", websocket_endpoint)

if __name__ == "__main__":
    # Run the FastAPI application using Uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
