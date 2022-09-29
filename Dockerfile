FROM nginx:1.16.0

WORKDIR /zadig-portal

ARG REPO_NAME="zadig-portal"
ARG BUILD_TIME
ARG COMMIT_ID
ARG BRANCH
ARG PR
ARG TAG
ARG BUILD_URL

LABEL maintainer="Zadig Maintainers" \
    description="Zadig is a cloud native, distributed, developer-oriented continuous delivery product." \
    repoName=${REPO_NAME} \
    branch=${BRANCH} \
    pr=${PR} \
    tag=${TAG} \
    commit=${COMMIT_ID} \
    buildTime=${BUILD_TIME} \
    buildURL=${BUILD_URL}



ADD dist/ /zadig-portal/
ADD zadig-nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
