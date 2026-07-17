import pytest
import mongomock
from unittest.mock import MagicMock, AsyncMock
import app.core.database

# --- ASYNC MONGOMOCK ADAPTER ---

class MockAsyncCursor:
    def __init__(self, sync_cursor):
        self.sync_cursor = sync_cursor
        self.iterator = None

    def sort(self, *args, **kwargs):
        self.sync_cursor = self.sync_cursor.sort(*args, **kwargs)
        return self

    def skip(self, n):
        self.sync_cursor = self.sync_cursor.skip(n)
        return self

    def limit(self, n):
        self.sync_cursor = self.sync_cursor.limit(n)
        return self

    async def to_list(self, length):
        return list(self.sync_cursor)

    def __aiter__(self):
        self.iterator = iter(self.sync_cursor)
        return self

    async def __anext__(self):
        if self.iterator is None:
            self.iterator = iter(self.sync_cursor)
        try:
            return next(self.iterator)
        except StopIteration:
            raise StopAsyncIteration


class MockAsyncCollection:
    def __init__(self, sync_col):
        self.sync_col = sync_col

    async def insert_one(self, doc):
        return self.sync_col.insert_one(doc)

    async def find_one(self, query, *args, **kwargs):
        return self.sync_col.find_one(query, *args, **kwargs)

    async def update_one(self, query, update, *args, **kwargs):
        return self.sync_col.update_one(query, update, *args, **kwargs)

    async def update_many(self, query, update, *args, **kwargs):
        return self.sync_col.update_many(query, update, *args, **kwargs)

    async def delete_one(self, query, *args, **kwargs):
        return self.sync_col.delete_one(query, *args, **kwargs)

    async def count_documents(self, query, *args, **kwargs):
        return self.sync_col.count_documents(query, *args, **kwargs)

    def find(self, query=None, *args, **kwargs):
        cursor = self.sync_col.find(query or {}, *args, **kwargs)
        return MockAsyncCursor(cursor)


class MockAsyncDatabase:
    def __init__(self):
        self.client = mongomock.MongoClient()
        self.db = self.client["testdb"]

    def __getitem__(self, name):
        return MockAsyncCollection(self.db[name])


# --- PYTEST FIXTURES ---

@pytest.fixture(autouse=True)
def mock_db_connection(monkeypatch):
    """Overrides motor database reference with asynchronous mongomock."""
    mock_db = MockAsyncDatabase()
    
    # Patch database functions
    monkeypatch.setattr(app.core.database, "get_db", lambda: mock_db)
    monkeypatch.setattr(app.core.database, "col", lambda name: mock_db[name])
    app.core.database._db = mock_db
    return mock_db


@pytest.fixture(autouse=True)
def mock_redis_and_celery(monkeypatch):
    """Mocks Celery send task and Redis connections to allow offline testing."""
    # Mock Redis client
    mock_redis = MagicMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock(return_value=True)
    mock_redis.delete = AsyncMock(return_value=True)
    mock_redis.ping = AsyncMock(return_value=True)
    
    # Mock Celery send task
    from app.workers.celery_app import celery_app
    monkeypatch.setattr(celery_app, "send_task", MagicMock())
    
    return mock_redis


@pytest.fixture
def test_app():
    """Initializes the FastAPI application instance."""
    from app.main import app as fastapi_app
    return fastapi_app


import pytest_asyncio

@pytest_asyncio.fixture
async def client(test_app):
    """Exposes HTTPX test client."""
    from httpx import AsyncClient
    async with AsyncClient(app=test_app, base_url="http://test") as ac:
        yield ac
