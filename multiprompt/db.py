from .imports import *

def generate_cache_key(data):
    hasher = hashlib.sha256()

    # Sort the dictionary items to ensure consistent ordering
    sorted_items = sorted(data.items(), key=lambda x: x[0])

    for key, value in sorted_items:
        # Convert the key and value to a consistent string representation
        key_str = str(key).encode("utf-8")

        # Handle different types of values
        if isinstance(value, (dict, list)):
            value_str = json.dumps(value, sort_keys=True).encode("utf-8")
        else:
            value_str = str(value).encode("utf-8")

        # Update the hasher with both key and value
        hasher.update(key_str)
        hasher.update(value_str)

    return hasher.hexdigest()
