from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Optional
from app.enterprise.network_schemas import DirectoryEntry

router = APIRouter(
    prefix="/api/v1/directory",
    tags=["Parallax Directory"]
)

# In-memory mock registry for Enterprise AI Agents
_GLOBAL_REGISTRY: Dict[str, DirectoryEntry] = {}

@router.post("/publish", response_model=DirectoryEntry)
async def publish_agent(entry: DirectoryEntry):
    """
    Publishes a "Public Agent" to the decentralized Parallax Directory.
    Exposes capabilities (JSON schemas, pricing) without leaking internal routing URLs.
    All external traffic must hit the proxy endpoint defined in `endpoint_url`.
    """
    if entry.did in _GLOBAL_REGISTRY:
        raise HTTPException(status_code=409, detail="An agent with this DID is already published.")
        
    # In a real environment, this would be broadcasted to the Parallax DLT or a central high-availability registry
    _GLOBAL_REGISTRY[entry.did] = entry
    
    return entry

@router.get("/search", response_model=List[DirectoryEntry])
async def search_directory(service_name: Optional[str] = None, org_id: Optional[str] = None):
    """
    Queries the Parallax Directory to discover available enterprise AI services.
    """
    results = list(_GLOBAL_REGISTRY.values())
    
    if service_name:
        results = [entry for entry in results if service_name.lower() in entry.service_name.lower()]
        
    if org_id:
        results = [entry for entry in results if entry.org_id == org_id]
        
    return results
