from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import create_application_table
from routers.applications import router as application_router


app = FastAPI(
    title="Union Parishad Digital Service API",
    description="Backend API for Union Parishad Digital Service",
    version="1.0.0"
)


# CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# DATABASE TABLE CREATION
@app.on_event("startup")
def startup():
    create_application_table()


# REGISTER APPLICATION ROUTER
app.include_router(application_router)


# HOME ROUTE
@app.get("/")
def home():
    return {
        "message": "Union Parishad Digital Service API is running"
    }