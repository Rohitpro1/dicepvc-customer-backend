from datetime import datetime, timezone
from typing import Any, Generic, TypeVar, Optional
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str, model_class: type[ModelType]):
        self.db = db
        self.collection_name = collection_name
        self.model_class = model_class

    @property
    def collection(self) -> AsyncIOMotorCollection:
        return self.db[self.collection_name]

    async def get_by_id(self, doc_id: str) -> Optional[ModelType]:
        """Fetch a document by its custom string ID."""
        doc = await self.collection.find_one({"id": doc_id, "is_deleted": {"$ne": True}})
        if doc:
            return self.model_class.model_validate(doc)
        return None

    async def find_one(self, query: dict[str, Any]) -> Optional[ModelType]:
        """Find the first matching document."""
        query["is_deleted"] = {"$ne": True}
        doc = await self.collection.find_one(query)
        if doc:
            return self.model_class.model_validate(doc)
        return None

    async def find(
        self,
        query: dict[str, Any],
        sort: list[tuple[str, int]] | None = None,
        limit: int = 100,
        skip: int = 0
    ) -> list[ModelType]:
        """Find multiple matching documents."""
        query["is_deleted"] = {"$ne": True}
        cursor = self.collection.find(query)
        
        if sort:
            cursor = cursor.sort(sort)
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)

        docs = await cursor.to_list(length=limit)
        return [self.model_class.model_validate(d) for d in docs]

    async def insert(self, model: ModelType) -> ModelType:
        """Insert a new document."""
        data = model.model_dump(by_alias=True)
        await self.collection.insert_one(data)
        return model

    async def update(self, doc_id: str, patch_data: dict[str, Any]) -> Optional[ModelType]:
        """Update fields in an existing document."""
        patch_data["updated_at"] = patch_data.get("updated_at", datetime.now(timezone.utc))
        await self.collection.update_one(
            {"id": doc_id, "is_deleted": {"$ne": True}},
            {"$set": patch_data}
        )
        return await self.get_by_id(doc_id)

    async def soft_delete(self, doc_id: str, actor_id: str = "system") -> bool:
        """Logically delete a document."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        result = await self.collection.update_one(
            {"id": doc_id, "is_deleted": {"$ne": True}},
            {
                "$set": {
                    "is_deleted": True,
                    "deleted_at": now,
                    "updated_at": now,
                    "updated_by": actor_id
                }
            }
        )
        return result.modified_count > 0

    async def count(self, query: dict[str, Any]) -> int:
        """Count active matching documents."""
        query["is_deleted"] = {"$ne": True}
        return await self.collection.count_documents(query)
