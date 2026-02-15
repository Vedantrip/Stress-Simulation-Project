from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from engine import SimulationEngine

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SimulationRequest(BaseModel):
    traffic_rps: float
    read_ratio: float = 0.95
    cache_hit_ratio: float = 0.8
    blueprint: dict


@app.get("/")
def root():
    return {"message": "ScaleLab Simulation API is running 🚀"}


@app.post("/simulate")
def simulate(request: SimulationRequest):
    engine = SimulationEngine(request.blueprint)

    result = engine.run_simulation(
        traffic_rps=request.traffic_rps,
        read_ratio=request.read_ratio,
        cache_hit_ratio=request.cache_hit_ratio
    )

    return result
