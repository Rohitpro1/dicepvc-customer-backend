from fastapi import status


class BaseAppException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(BaseAppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(BaseAppException):
    def __init__(self, message: str = "Unauthorized access"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(BaseAppException):
    def __init__(self, message: str = "Action forbidden"):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN)


class ValidationException(BaseAppException):
    def __init__(self, message: str = "Invalid input details"):
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class RateLimitException(BaseAppException):
    def __init__(self, message: str = "Too many requests. Please slow down."):
        super().__init__(message, status_code=status.HTTP_429_TOO_MANY_REQUESTS)


class ExternalServiceException(BaseAppException):
    def __init__(self, message: str = "Failed to communicate with external dependency"):
        super().__init__(message, status_code=status.HTTP_502_BAD_GATEWAY)
