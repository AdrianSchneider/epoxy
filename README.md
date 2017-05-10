# epoxy

epoxy is a tiny http proxy meant to help test idempotency of REST servers. You would stick it between a client and a server, and you can force several failure types.

## Setup

```bash
docker built -t epoxy .

# requests will fail 3 times before hitting localhost:4000
docker run -it epoxy -p http://localhost:4000 -s attempts -t 3

# requests will fail 10% of time before hitting backend
# and 30% of the time after backend, before responding
docker run -it epoxy -p http://localhost:4000 -s percent -a 10 -b 30
```

## Future Plans

- better "request hashing" for attempts strategy
- more well-behaved proxy (headers)
- other failure types (timeouts, etc.)
