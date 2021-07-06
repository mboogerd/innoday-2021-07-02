instance=$1
ip=$(ifconfig en0 | grep "inet " | cut -d\  -f2)

if [ -z $instance ]; then
    instance=1
fi

lipp2pport=$(expr $instance + 4001)
apiport=$(expr $instance + 8080)
gatewayport=$(expr $instance + 5001)
ipfs_host=ipfs_host_$instance

echo $ipfs_host listening on $libp2pport

ipfs_staging=$PWD/ipfs/$ipfs_host/staging
mkdir -p $ipfs_staging
ipfs_data=$PWD/ipfs/$ipfs_host/data
mkdir -p $ipfs_data
ipfs_config=$PWD/ipfs/config
mkdir -p $ipfs_config

docker run \
    -d \
    --name $ipfs_host \
    -e IPFS_SWARM_KEY_FILE="/config/swarm.key" \
    -v $ipfs_config:/config \
    -v $ipfs_staging:/export \
    -v $ipfs_data:/data/ipfs \
    -p $lipp2pport:4001 \
    -p $lipp2pport:4001/udp \
    -p 127.0.0.1:$apiport:8080 \
    -p 127.0.0.1:$gatewayport:5001 \
    ipfs/go-ipfs:latest \
    daemon \
    --writable \
    --enable-pubsub-experiment

# This script presumes the existence of a bootstrap IPFS node at your en0 interface
until docker exec $ipfs_host ipfs bootstrap rm --all
do
    echo "IPFS not ready. Re-attempting to clear bootstrap nodes in 1 second"
    sleep 1
done

docker exec $ipfs_host ipfs bootstrap add "/ip4/$ip/tcp/4001/p2p/12D3KooWA7mWoWpVQU6nknHUxsZE3Va9JwG8UraY7iKqL2CcgSHW"
