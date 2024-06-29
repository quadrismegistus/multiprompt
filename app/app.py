from .config import *

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
