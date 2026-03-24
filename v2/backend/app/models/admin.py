from pydantic import BaseModel
from typing import Optional


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminRegister(BaseModel):
    username: str
    email: str
    password: str


class AdminChangePassword(BaseModel):
    current_password: str
    new_password: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
