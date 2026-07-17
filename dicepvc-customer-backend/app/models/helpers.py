import secrets
from datetime import datetime, timezone


def new_id(prefix: str) -> str:
    """Generates a secure 16-character hexadecimal ID prefixed with prefix_."""
    rand_hex = secrets.token_hex(8)  # 16 characters
    return f"{prefix}_{rand_hex}"


def now_iso() -> str:
    """Returns current UTC timestamp in ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat()


def serialize_doc(doc: dict) -> dict:
    """Recursively serializes MongoDB ObjectIds and datetime instances inside a document."""
    if not doc:
        return doc
        
    serialized = {}
    for k, v in doc.items():
        if k == "_id":
            serialized["_id"] = str(v)
        elif isinstance(v, datetime):
            serialized[k] = v.isoformat()
        elif isinstance(v, dict):
            serialized[k] = serialize_doc(v)
        elif isinstance(v, list):
            serialized[k] = [serialize_doc(i) if isinstance(i, dict) else i for i in v]
        else:
            serialized[k] = v
    return serialized


def serialize_many(docs: list[dict]) -> list[dict]:
    """Helper to serialize lists of BSON documents to JSON-compliant dictionaries."""
    return [serialize_doc(d) for d in docs]
