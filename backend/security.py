import base64
import binascii
import hashlib
import secrets


PASSWORD_SCHEME = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 600_000
SALT_BYTES = 16


def hash_password(password: str) -> str:
    """Create a salted PBKDF2-SHA256 password hash for database storage."""
    salt = secrets.token_bytes(SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )
    encoded_salt = base64.urlsafe_b64encode(salt).decode("ascii")
    encoded_digest = base64.urlsafe_b64encode(digest).decode("ascii")
    return f"{PASSWORD_SCHEME}${PASSWORD_ITERATIONS}${encoded_salt}${encoded_digest}"


def is_password_hash(value: str) -> bool:
    return isinstance(value, str) and value.startswith(f"{PASSWORD_SCHEME}$")


def verify_password(password: str, stored_password: str) -> bool:
    """Verify a password hash, with a compatibility path for legacy plaintext rows."""
    if not isinstance(stored_password, str):
        return False

    if not is_password_hash(stored_password):
        return secrets.compare_digest(
            password.encode("utf-8"),
            stored_password.encode("utf-8"),
        )

    try:
        scheme, iterations, encoded_salt, encoded_digest = stored_password.split("$", 3)
        if scheme != PASSWORD_SCHEME:
            return False

        parsed_iterations = int(iterations)
        if parsed_iterations < 100_000 or parsed_iterations > 2_000_000:
            return False

        salt = base64.urlsafe_b64decode(encoded_salt.encode("ascii"))
        expected_digest = base64.urlsafe_b64decode(encoded_digest.encode("ascii"))
        candidate_digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            parsed_iterations,
        )
    except (binascii.Error, OverflowError, TypeError, ValueError, UnicodeError):
        return False

    return secrets.compare_digest(candidate_digest, expected_digest)


def password_needs_rehash(stored_password: str) -> bool:
    if not is_password_hash(stored_password):
        return True

    try:
        _, iterations, _, _ = stored_password.split("$", 3)
        return int(iterations) != PASSWORD_ITERATIONS
    except (TypeError, ValueError):
        return True


def public_user(user) -> dict:
    """Return user data that is safe to send to frontend clients."""
    return {
        "id": user.id,
        "name": user.name,
        "role": user.role,
        "grade_level": user.grade_level,
    }
