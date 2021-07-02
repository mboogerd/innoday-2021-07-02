export ipfs_staging=$PWD/ipfs/staging
mkdir -p $ipfs_staging
export ipfs_data=$PWD/ipfs/data
mkdir -p $ipfs_data
export ipfs_config=$PWD/ipfs/config
mkdir -p $ipfs_config

docker run -d --name ipfs_host -e IPFS_SWARM_KEY_FILE="/config/swarm.key" -v $ipfs_config:/config -v $ipfs_staging:/export -v $ipfs_data:/data/ipfs -p 4002:4001 -p 4002:4001/udp -p 127.0.0.1:8081:8080 -p 127.0.0.1:5002:5001 ipfs/go-ipfs:latest

docker exec ipfs_host ipfs bootstrap rm --all
docker exec ipfs_host ipfs bootstrap add "/ip4/172.16.48.44/tcp/4001/p2p/12D3KooWA7mWoWpVQU6nknHUxsZE3Va9JwG8UraY7iKqL2CcgSHW"

# Using docker compose

# cat ~/.ipfs/swarm.key | docker secret create swarm_key_secret -
# docker run -d --name ipfs_host --secret swarm_key_secret -e IPFS_SWARM_KEY_FILE=/run/secrets/swarm_key_secret -v $ipfs_staging:/export -v $ipfs_data:/data/ipfs -p 4002:4001 -p 4002:4001/udp -p 127.0.0.1:8081:8080 -p 127.0.0.1:5002:5001 ipfs/go-ipfs:latest