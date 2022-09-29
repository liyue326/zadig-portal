#!/bin/bash

## Build docker image.

version=$1

# ccr.ccs.tencentyun.com/koderover-rc

image_name=koderover.tencentcloudcr.com/koderover-public/zadig-portal:$version

arch_name="$(uname -m)"

if [ $# = 0 ];then
    echo "Version must be provided. example: ./publish.sh 1.0.0"
    exit 1
fi
 
yarn install --ignore-engines

yarn run build

if [ "${arch_name}" = "x86_64" ]; then
    docker build --rm=true -t $image_name -f amd64.Dockerfile .
    docker push $image_name
elif [ "${arch_name}" = "arm64" ]; then
    docker buildx build --platform linux/amd64 --rm=true -t $image_name -f amd64.Dockerfile .
    docker push $image_name
else
    echo "Unknown architecture: ${arch_name}"
    exit 1
fi

echo -e "image_name:\033[33m $image_name \033[0m"


