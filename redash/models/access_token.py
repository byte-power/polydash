from redash import redis_connection
from redash.utils import generate_token


class AccessToken:
    __access_token_prefix__ = "redash:embed:access_token:" 

    def __init__(self, access_token=None, fn=None, **kwargs):
        if fn:
            self.fn = fn
        else:
            self.fn = generate_token
        self.access_token = access_token


    def new(self, ttl):
        access_token = self.fn(24)
        key = "{}{}".format(self.__access_token_prefix__, access_token)
        redis_connection.set(key,  "1", ex=ttl)
        return access_token


    @property
    def is_valid(self):
        key = "{}{}".format(self.__access_token_prefix__, self.access_token)
        value = redis_connection.get(key)
        return (value is not None)